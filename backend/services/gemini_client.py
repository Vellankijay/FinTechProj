"""
Gemini API client with tool-calling support.
"""
import json
from typing import Dict, List, Any
import google.generativeai as genai
from ..infra.secrets import vault
from ..infra.types import GeminiResponse, ToolCall


# ---------------------------------------------------------
# Configure Gemini
# ---------------------------------------------------------
def _get_gemini_model():
    """Initialize Gemini model with API key."""
    api_key = vault("GEMINI_API_KEY", required=True)
    genai.configure(api_key=api_key)
    # Using gemini-2.0-flash-exp (experimental but works with your API key)
    return genai.GenerativeModel('gemini-2.5-flash')


# ---------------------------------------------------------
# Convert internal tool definitions to Gemini schema
# ---------------------------------------------------------
def _convert_tool_to_gemini_schema(tool_name: str, tool_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert internal tool definition to Gemini function declaration schema (dict-based).

    Args:
        tool_name: Name of the tool
        tool_info: Tool metadata with description and parameters

    Returns:
        Dictionary representing Gemini-compatible function declaration
    """
    # Clean up properties to remove unsupported Gemini schema fields
    properties = {}
    for param_name, param_def in tool_info.get("parameters", {}).items():
        cleaned_param = {k: v for k, v in param_def.items() if k not in ["default", "examples"]}
        properties[param_name] = cleaned_param
    
    return {
        "name": tool_name,
        "description": tool_info.get("description", ""),
        "parameters": {
            "type": "object",
            "properties": properties,
            "required": tool_info.get("required", [])
        }
    }


# ---------------------------------------------------------
# Chat with tools
# ---------------------------------------------------------
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

        # Convert tools to Gemini function declaration dicts
        gemini_tools = [
            _convert_tool_to_gemini_schema(name, info)
            for name, info in tools.items()
        ]

        # Configure generation
        generation_config = {
            "temperature": 0.7,
            "max_output_tokens": 2048,
        }

        # Generate response with or without tools
        if gemini_tools:
            response = model.generate_content(
                full_prompt,
                tools=[{"function_declarations": gemini_tools}],
                generation_config=generation_config,
                safety_settings=[]
            )
        else:
            response = model.generate_content(
                full_prompt,
                generation_config=generation_config
            )

        # Parse tool calls
        tool_calls = []
        if getattr(response, "candidates", None):
            candidate = response.candidates[0]
            if getattr(candidate, "content", None) and getattr(candidate.content, "parts", None):
                for part in candidate.content.parts:
                    if getattr(part, "function_call", None):
                        fc = part.function_call
                        tool_calls.append(ToolCall(
                            name=fc.name,
                            args=dict(fc.args) if fc.args else {}
                        ))

        # Parse text response
        text_response = getattr(response, "text", "")
        if not text_response:
            if tool_calls:
                text_response = "Let me check that for you..."
            else:
                text_response = "I understand. How can I help you with risk operations?"

        return GeminiResponse(text=text_response, tool_calls=tool_calls)

    except Exception as e:
        print(f"[ERROR] Gemini API error: {e}")
        return GeminiResponse(
            text=f"I encountered an error processing your request: {str(e)}",
            tool_calls=[]
        )


# ---------------------------------------------------------
# Continue conversation after executing a tool
# ---------------------------------------------------------
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