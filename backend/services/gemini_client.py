"""
Gemini API client with tool-calling support.
"""
import json
from typing import Dict, List, Any
import google.generativeai as genai
from ..infra.secrets import vault
from ..infra.types import GeminiResponse, ToolCall


# Configure Gemini
def _get_gemini_model():
    """Initialize Gemini model with API key."""
    api_key = vault("GEMINI_API_KEY", required=True)
    genai.configure(api_key=api_key)
    # Using gemini-2.0-flash-exp (experimental but works with your API key)
    return genai.GenerativeModel('gemini-2.0-flash-exp')


def _convert_tool_to_gemini_schema(tool_name: str, tool_info: Dict[str, Any]) -> genai.protos.FunctionDeclaration:
    """
    Convert internal tool definition to Gemini function declaration schema.

    Args:
        tool_name: Name of the tool
        tool_info: Tool metadata with description and parameters

    Returns:
        Gemini-compatible function declaration protobuf
    """
    # Build properties for parameters
    properties = {}
    for param_name, param_info in tool_info.get("parameters", {}).items():
        prop_dict = {
            "type_": param_info.get("type", "string").upper(),  # STRING, NUMBER, etc.
            "description": param_info.get("description", "")
        }
        properties[param_name] = genai.protos.Schema(**prop_dict)

    # Build parameters schema
    parameters = genai.protos.Schema(
        type_=genai.protos.Type.OBJECT,
        properties=properties,
        required=tool_info.get("required", [])
    )

    return genai.protos.FunctionDeclaration(
        name=tool_name,
        description=tool_info.get("description", ""),
        parameters=parameters
    )


def chat_with_tools(
    system: str,
    tools: Dict[str, Dict[str, Any]],
    context: Dict[str, Any],
    messages: List[Dict[str, str]]
) -> GeminiResponse:
    """
    Chat with Gemini using tool-calling capabilities.

    Args:
        system: System prompt/instructions
        tools: Dictionary of tool definitions with schemas
        context: Context information to include in prompt
        messages: Conversation history

    Returns:
        GeminiResponse with text and tool_calls

    Example:
        tools = {
            "get_metric": {
                "description": "Get risk metric for a book",
                "parameters": {
                    "book": {"type": "string", "description": "Book name"},
                    "metric": {"type": "string", "description": "Metric type"}
                },
                "required": ["book", "metric"]
            }
        }
        response = chat_with_tools(system, tools, context, messages)
    """
    try:
        model = _get_gemini_model()

        # Build the full prompt with system instructions and context
        context_str = json.dumps(context, indent=2)
        full_prompt = f"""{system}

## Context
You have access to the following context information:
{context_str}

## Available Tools
You can call the following tools to help answer questions:
{json.dumps({name: info.get('description', '') for name, info in tools.items()}, indent=2)}

## Conversation
"""

        # Add conversation history
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            full_prompt += f"\n{role.upper()}: {content}\n"

        # Convert tools to Gemini function declarations
        gemini_tools = [
            _convert_tool_to_gemini_schema(name, info)
            for name, info in tools.items()
        ]

        # Create Gemini tools configuration
        generation_config = {
            "temperature": 0.7,
            "max_output_tokens": 2048,
        }

        # Generate response
        if gemini_tools:
            # Create Tool object with function declarations
            tool = genai.protos.Tool(function_declarations=gemini_tools)
            response = model.generate_content(
                full_prompt,
                tools=[tool],
                generation_config=generation_config
            )
        else:
            response = model.generate_content(
                full_prompt,
                generation_config=generation_config
            )

        # Parse response
        tool_calls = []

        # Check if there are function calls in the response
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                for part in candidate.content.parts:
                    if hasattr(part, 'function_call'):
                        fc = part.function_call
                        tool_calls.append(ToolCall(
                            name=fc.name,
                            args=dict(fc.args) if fc.args else {}
                        ))

        # Get text response
        text_response = ""
        try:
            # Try to get text from response
            if hasattr(response, 'text') and response.text:
                text_response = response.text
        except ValueError:
            # If response has function calls but no text, that's expected
            pass

        # If there are tool calls but no text, provide a default message
        if tool_calls and not text_response:
            text_response = "Let me check that for you..."
        elif not tool_calls and not text_response:
            # If no tool calls and no text, provide a default message
            text_response = "I understand. How can I help you with risk operations?"

        return GeminiResponse(
            text=text_response,
            tool_calls=tool_calls
        )

    except Exception as e:
        print(f"[ERROR] Gemini API error: {e}")
        # Return error response
        return GeminiResponse(
            text=f"I encountered an error processing your request: {str(e)}",
            tool_calls=[]
        )


def continue_with_tool_result(
    system: str,
    tools: Dict[str, Dict[str, Any]],
    context: Dict[str, Any],
    previous_messages: List[Dict[str, str]],
    tool_name: str,
    tool_result: Any
) -> GeminiResponse:
    """
    Continue conversation after executing a tool.

    Args:
        system: System prompt
        tools: Available tools
        context: Context information
        previous_messages: Previous conversation
        tool_name: Name of tool that was executed
        tool_result: Result from tool execution

    Returns:
        GeminiResponse with final text
    """
    # Add tool result to conversation
    messages = previous_messages + [
        {
            "role": "assistant",
            "content": f"[Tool {tool_name} executed with result: {json.dumps(tool_result)}]"
        },
        {
            "role": "user",
            "content": "Please summarize the result and provide your analysis."
        }
    ]

    return chat_with_tools(system, tools, context, messages)
