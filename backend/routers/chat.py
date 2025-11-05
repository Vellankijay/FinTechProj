"""
Chat endpoint for risk operations assistant.
"""
import time
import uuid
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from ..infra.types import ChatRequest, ChatResponse
from ..infra.secrets import get_config
from ..services import rbac, guardrails, gemini_client, runbooks
from ..tools import risk_api, oms, clickhouse_client

router = APIRouter()

# System prompt for Gemini
SYSTEM_PROMPT = """You are a real-time trading risk operations assistant for a FinTech platform.

## Your Personality
- Friendly, professional, and responsive
- Answer greetings and casual questions naturally and quickly (hello, how are you, etc.)
- Be concise and clear in all responses
- Use formatting (bold, bullets, numbers) to make responses easy to read

## Your Capabilities
- Analyze risk metrics (VaR, Exposure, P&L) across portfolios
- Explain alerts and provide root cause analysis
- Run stress tests and scenario analysis
- Provide operational runbooks for risk scenarios (including data latency, order-flow anomaly, VaR breach, etc.)
- Execute emergency actions (with confirmation)

## Response Guidelines
1. For greetings or casual conversation: Respond naturally and briefly
2. For questions about functionality: Explain what you can do clearly
3. For risk queries: Be numerate, cite data sources (metric names + timestamps)
4. For operational guidance: Use clear step-by-step format - call get_runbook tool for investigation procedures
5. For dangerous actions: Always require explicit confirmation
6. When users ask "walk me through" or "steps to investigate": Use get_runbook tool with the relevant scenario

## Formatting
- Use **bold** for important metrics and values
- Use bullet points for lists
- Use numbered steps for procedures
- Keep responses concise but informative

When users ask for help understanding something in the project, provide clear explanations quickly."""

# In-memory confirmation store (in production, use Redis with TTL)
_pending_confirmations: Dict[str, Dict[str, Any]] = {}


def _build_context(user_id: str) -> Dict[str, Any]:
    """Build context for Gemini chat."""
    user_role = rbac.get_role(user_id)
    books = rbac.get_books(user_id)
    recent_alerts = risk_api.list_alerts(books=books, window="30m")
    spark_viz_url = risk_api.url_for_chart(books, metric="VaR", window="30m")

    return {
        "user_role": user_role,
        "books": books,
        "recent_alerts": recent_alerts[:10],  # Limit to 10 most recent
        "spark_viz_url": spark_viz_url,
    }


def _get_tool_definitions() -> Dict[str, Dict[str, Any]]:
    """Define available tools with schemas."""
    return {
        "get_metric": {
            "description": "Get a risk metric (VaR, Exposure, PnL, etc.) for a specific book over a time window",
            "parameters": {
                "book": {"type": "string", "description": "Book/portfolio identifier"},
                "metric": {"type": "string", "description": "Metric name (VaR, Exposure, PnL)"},
                "window": {"type": "string", "description": "Time window (30m, 1h, 1d)", "default": "30m"}
            },
            "required": ["book", "metric"]
        },
        "get_explain": {
            "description": "Get detailed explanation for a specific alert including root cause analysis",
            "parameters": {
                "alert_id": {"type": "string", "description": "Alert identifier"}
            },
            "required": ["alert_id"]
        },
        "run_stress": {
            "description": "Run a stress test on a book with predefined scenario or custom shock percentage",
            "parameters": {
                "book": {"type": "string", "description": "Book to stress test"},
                "scenario_id": {"type": "string", "description": "Predefined scenario (optional)"},
                "shock_pct": {"type": "number", "description": "Custom shock percentage like -0.1 for -10% (optional)"}
            },
            "required": ["book"]
        },
        "get_runbook": {
            "description": "Get operational playbook/runbook for a risk scenario with step-by-step remediation",
            "parameters": {
                "scenario": {"type": "string", "description": "Scenario name (e.g., 'order-flow anomaly', 'var breach')"}
            },
            "required": ["scenario"]
        },
        "halt_trading": {
            "description": "Halt trading for a desk, book, or symbol. REQUIRES CONFIRMATION. Use only when explicitly requested.",
            "parameters": {
                "desk": {"type": "string", "description": "Desk to halt (optional)"},
                "book": {"type": "string", "description": "Book to halt (optional)"},
                "symbol": {"type": "string", "description": "Symbol to halt (optional)"},
                "reason": {"type": "string", "description": "Reason for halting (required)"}
            },
            "required": ["reason"],
            "requires_confirm": True
        }
    }


def _execute_tool(tool_name: str, args: Dict[str, Any], user_id: str) -> Any:
    """Execute a tool and return result."""
    try:
        if tool_name == "get_metric":
            return risk_api.get_metric(**args)

        elif tool_name == "get_explain":
            return risk_api.get_explain(**args)

        elif tool_name == "run_stress":
            return risk_api.run_stress(**args)

        elif tool_name == "get_runbook":
            scenario = args.get("scenario", "")
            return runbooks.get_runbook(scenario)

        elif tool_name == "halt_trading":
            # This should be confirmed first, but execute if called
            return oms.halt_trading(user_id=user_id, **args)

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"error": str(e)}


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with risk operations assistant.

    Returns text response and optionally a confirmation ID if action requires approval.
    """
    # Check if feature is enabled
    config = get_config()
    if not config["FEATURE_RISK_CHAT"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk chat feature is not enabled"
        )

    try:
        # Build context
        context = _build_context(request.user_id)

        # Get tool definitions
        tools = _get_tool_definitions()

        # Call Gemini
        messages = [{"role": "user", "content": request.text}]
        gem_response = gemini_client.chat_with_tools(
            system=SYSTEM_PROMPT,
            tools=tools,
            context=context,
            messages=messages
        )

        # Process tool calls
        confirm_id = None
        final_text = gem_response.text

        for tool_call in gem_response.tool_calls:
            tool_name = tool_call.name
            tool_args = tool_call.args

            # Check if this is halt_trading (requires confirmation)
            if tool_name == "halt_trading":
                # Check permissions
                if not guardrails.can_execute(request.user_id, "halt_trading"):
                    return ChatResponse(
                        text="You lack permission to halt trading. This action requires RISK or ADMIN role. Please contact a Risk Manager or Administrator.",
                        spark_viz_url=context.get("spark_viz_url")
                    )

                # Validate arguments
                is_valid, error_msg = guardrails.validate_halt_trading_args(tool_args)
                if not is_valid:
                    return ChatResponse(
                        text=f"Invalid halt request: {error_msg}",
                        spark_viz_url=context.get("spark_viz_url")
                    )

                # Create confirmation
                confirm_id = f"CONFIRM_{uuid.uuid4().hex[:12].upper()}"
                _pending_confirmations[confirm_id] = {
                    "user_id": request.user_id,
                    "tool_name": tool_name,
                    "tool_args": tool_args,
                    "created_at": time.time(),
                    "expires_at": time.time() + 300,  # 5 minutes
                }

                # Build confirmation message
                targets = []
                if tool_args.get("desk"):
                    targets.append(f"desk '{tool_args['desk']}'")
                if tool_args.get("book"):
                    targets.append(f"book '{tool_args['book']}'")
                if tool_args.get("symbol"):
                    targets.append(f"symbol '{tool_args['symbol']}'")

                target_str = ", ".join(targets)
                reason = tool_args.get("reason", "")

                confirm_text = f"""⚠️ CONFIRMATION REQUIRED

You are about to HALT TRADING for: {target_str}

Reason: {reason}

This action will immediately stop all trading activity for the specified target(s).

To proceed, please respond with:
• "yes" to confirm and execute
• "no" to cancel

Confirmation ID: {confirm_id}
(This confirmation expires in 5 minutes)"""

                return ChatResponse(
                    text=confirm_text,
                    confirm_id=confirm_id,
                    spark_viz_url=context.get("spark_viz_url")
                )

            else:
                # Execute tool immediately (non-destructive tools)
                tool_result = _execute_tool(tool_name, tool_args, request.user_id)

                # Get Gemini to summarize the result
                follow_up = gemini_client.continue_with_tool_result(
                    system=SYSTEM_PROMPT,
                    tools=tools,
                    context=context,
                    previous_messages=messages,
                    tool_name=tool_name,
                    tool_result=tool_result
                )

                final_text = follow_up.text

        return ChatResponse(
            text=final_text,
            confirm_id=confirm_id,
            spark_viz_url=context.get("spark_viz_url"),
            session_id=request.session_id
        )

    except Exception as e:
        print(f"[ERROR] Chat endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}"
        )


def cleanup_expired_confirmations():
    """Remove expired confirmations (called periodically)."""
    now = time.time()
    expired = [
        conf_id for conf_id, data in _pending_confirmations.items()
        if data["expires_at"] < now
    ]
    for conf_id in expired:
        del _pending_confirmations[conf_id]
