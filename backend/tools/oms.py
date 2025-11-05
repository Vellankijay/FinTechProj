"""
Order Management System (OMS) client for trading halt operations.
"""
import time
import uuid
from typing import Dict, Any, Optional
from ..infra.secrets import get_config
from ..infra.audit import log as audit_log


def _get_oms_url() -> str:
    """Get OMS base URL from config."""
    config = get_config()
    return config["OMS_BASE"]


def halt_trading(
    user_id: str,
    desk: Optional[str] = None,
    book: Optional[str] = None,
    symbol: Optional[str] = None,
    reason: str = ""
) -> Dict[str, Any]:
    """
    Halt trading for specified target(s).

    At least one of desk, book, or symbol must be provided.

    Args:
        user_id: User requesting the halt
        desk: Desk to halt (optional)
        book: Book to halt (optional)
        symbol: Symbol to halt (optional)
        reason: Reason for halting (required)

    Returns:
        Response with ticket ID and confirmation

    Raises:
        ValueError: If no target specified or reason missing
    """
    # Validate inputs
    if not any([desk, book, symbol]):
        raise ValueError("At least one of desk, book, or symbol must be specified")

    if not reason or len(reason.strip()) < 10:
        raise ValueError("Reason must be at least 10 characters")

    oms_url = _get_oms_url()
    endpoint = f"{oms_url}/halt"

    # Build halt request payload
    payload = {
        "reason": reason,
        "timestamp": time.time(),
        "requested_by": user_id,
    }

    if desk:
        payload["desk"] = desk
    if book:
        payload["book"] = book
    if symbol:
        payload["symbol"] = symbol

    # Generate ticket ID
    ticket_id = f"HALT_{uuid.uuid4().hex[:8].upper()}"

    print(f"[OMS] POST {endpoint}")
    print(f"[OMS] Halting trading: {payload}")

    try:
        # In production, this would make an actual HTTP request:
        # response = requests.post(endpoint, json=payload, timeout=10)
        # ticket_id = response.json()["ticket_id"]

        # Log to audit trail
        audit_log(
            user_id=user_id,
            action="halt_trading",
            details={
                "ticket_id": ticket_id,
                "desk": desk,
                "book": book,
                "symbol": symbol,
                "reason": reason,
            },
            result="success"
        )

        # Return success response
        return {
            "status": "halted",
            "ticket_id": ticket_id,
            "timestamp": time.time(),
            "targets": {
                "desk": desk,
                "book": book,
                "symbol": symbol,
            },
            "reason": reason,
            "message": f"Trading halted successfully. Ticket: {ticket_id}"
        }

    except Exception as e:
        # Log failure
        audit_log(
            user_id=user_id,
            action="halt_trading",
            details={
                "desk": desk,
                "book": book,
                "symbol": symbol,
                "reason": reason,
                "error": str(e),
            },
            result="failed"
        )

        raise Exception(f"Failed to halt trading: {str(e)}")


def resume_trading(
    user_id: str,
    ticket_id: str,
    reason: str
) -> Dict[str, Any]:
    """
    Resume trading that was previously halted.

    Args:
        user_id: User requesting resume
        ticket_id: Ticket ID from halt operation
        reason: Reason for resuming

    Returns:
        Response confirming resume
    """
    oms_url = _get_oms_url()
    endpoint = f"{oms_url}/resume"

    payload = {
        "ticket_id": ticket_id,
        "reason": reason,
        "timestamp": time.time(),
        "requested_by": user_id,
    }

    print(f"[OMS] POST {endpoint}")
    print(f"[OMS] Resuming trading: {payload}")

    try:
        # Mock response
        audit_log(
            user_id=user_id,
            action="resume_trading",
            details={
                "ticket_id": ticket_id,
                "reason": reason,
            },
            result="success"
        )

        return {
            "status": "resumed",
            "ticket_id": ticket_id,
            "timestamp": time.time(),
            "message": f"Trading resumed. Ticket: {ticket_id}"
        }

    except Exception as e:
        audit_log(
            user_id=user_id,
            action="resume_trading",
            details={
                "ticket_id": ticket_id,
                "error": str(e),
            },
            result="failed"
        )

        raise Exception(f"Failed to resume trading: {str(e)}")


def get_halt_status() -> Dict[str, Any]:
    """
    Get current halt status across all desks/books.

    Returns:
        Status of all halts
    """
    oms_url = _get_oms_url()
    endpoint = f"{oms_url}/halt/status"

    print(f"[OMS] GET {endpoint}")

    try:
        # Mock response
        return {
            "active_halts": [],
            "recent_halts": [],
            "timestamp": time.time()
        }

    except Exception as e:
        print(f"[OMS ERROR] {e}")
        return {"active_halts": [], "recent_halts": [], "error": str(e)}
