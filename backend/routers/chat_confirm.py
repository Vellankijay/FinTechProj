"""
Confirmation endpoint for approved actions.
"""
import time
from fastapi import APIRouter, HTTPException, status

from ..infra.types import ConfirmRequest, ConfirmResponse
from ..infra.secrets import get_config
from ..services import guardrails
from ..tools import oms

router = APIRouter()

# Import confirmation store from chat module
from .chat import _pending_confirmations, _execute_tool


@router.post("/api/chat/confirm", response_model=ConfirmResponse)
async def confirm_action(request: ConfirmRequest):
    """
    Confirm or cancel a pending action.

    Validates ownership and RBAC before executing.
    """
    # Check if feature is enabled
    config = get_config()
    if not config["FEATURE_RISK_CHAT"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk chat feature is not enabled"
        )

    # Get confirmation data
    confirm_data = _pending_confirmations.get(request.confirm_id)

    if not confirm_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Confirmation not found or expired"
        )

    # Validate ownership
    if confirm_data["user_id"] != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to confirm this action"
        )

    # Check expiration
    if time.time() > confirm_data["expires_at"]:
        del _pending_confirmations[request.confirm_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Confirmation expired. Please request the action again."
        )

    # Handle user's answer
    if request.answer == "no":
        # User cancelled
        del _pending_confirmations[request.confirm_id]
        return ConfirmResponse(
            status="cancelled",
            message="Action cancelled by user."
        )

    # User confirmed - execute action
    tool_name = confirm_data["tool_name"]
    tool_args = confirm_data["tool_args"]

    # Double-check RBAC
    if not guardrails.can_execute(request.user_id, tool_name):
        del _pending_confirmations[request.confirm_id]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to execute this action"
        )

    try:
        # Execute the confirmed action
        result = _execute_tool(tool_name, tool_args, request.user_id)

        # Remove from pending
        del _pending_confirmations[request.confirm_id]

        # Extract ticket ID if available
        ticket_id = result.get("ticket_id") if isinstance(result, dict) else None

        return ConfirmResponse(
            status="executed",
            ticket_id=ticket_id,
            message=f"Action executed successfully. {result.get('message', '')}"
        )

    except Exception as e:
        print(f"[ERROR] Confirmation execution failed: {e}")

        # Keep confirmation in case user wants to retry
        # (or remove it depending on error handling policy)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute action: {str(e)}"
        )
