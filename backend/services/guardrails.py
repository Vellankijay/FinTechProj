"""
Guardrails for validating and controlling user actions.
"""
from typing import Dict, Any, List
from .rbac import get_role, UserRole


# Actions that require elevated privileges
PRIVILEGED_ACTIONS = {
    "halt_trading": ["RISK", "ADMIN"],
    "modify_limits": ["RISK", "ADMIN"],
    "override_alert": ["RISK", "ADMIN"],
    "force_unwind": ["ADMIN"],
    "change_config": ["ADMIN"],
}


# Keys to redact from payloads (secrets, PII)
REDACT_KEYS = [
    "password",
    "api_key",
    "secret",
    "token",
    "ssn",
    "social_security",
    "credit_card",
    "cvv",
    "pin",
]


def can_execute(user_id: str, action: str) -> bool:
    """
    Check if user has permission to execute an action.

    Args:
        user_id: User identifier
        action: Action name (e.g., 'halt_trading')

    Returns:
        True if user can execute, False otherwise
    """
    user_role = get_role(user_id)

    # If action doesn't require special privileges, allow all users
    if action not in PRIVILEGED_ACTIONS:
        return True

    # Check if user's role is in the allowed roles for this action
    allowed_roles = PRIVILEGED_ACTIONS[action]
    return user_role in allowed_roles


def get_required_role(action: str) -> List[UserRole]:
    """
    Get the roles required to perform an action.

    Args:
        action: Action name

    Returns:
        List of roles that can perform this action
    """
    return PRIVILEGED_ACTIONS.get(action, ["USER", "RISK", "ADMIN"])


def redact(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Redact sensitive information from a payload.

    Args:
        payload: Dictionary potentially containing sensitive data

    Returns:
        Redacted copy of the payload
    """
    redacted = payload.copy()

    for key in list(redacted.keys()):
        # Check if key contains sensitive information
        key_lower = key.lower()
        if any(redact_key in key_lower for redact_key in REDACT_KEYS):
            redacted[key] = "***REDACTED***"

        # Recursively redact nested dictionaries
        elif isinstance(redacted[key], dict):
            redacted[key] = redact(redacted[key])

        # Redact lists of dictionaries
        elif isinstance(redacted[key], list):
            redacted[key] = [
                redact(item) if isinstance(item, dict) else item
                for item in redacted[key]
            ]

    return redacted


def validate_halt_trading_args(args: Dict[str, Any]) -> tuple[bool, str]:
    """
    Validate arguments for halt_trading action.

    Args:
        args: Arguments dictionary

    Returns:
        Tuple of (is_valid, error_message)
    """
    # At least one target must be specified
    if not any([args.get("desk"), args.get("book"), args.get("symbol")]):
        return False, "At least one of desk, book, or symbol must be specified"

    # Reason is required
    if not args.get("reason") or len(args.get("reason", "").strip()) < 10:
        return False, "Reason must be at least 10 characters"

    return True, ""


def validate_stress_test_args(args: Dict[str, Any]) -> tuple[bool, str]:
    """
    Validate arguments for stress testing.

    Args:
        args: Arguments dictionary

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Book is required
    if not args.get("book"):
        return False, "Book is required for stress testing"

    # If custom shock is provided, validate range
    shock_pct = args.get("shock_pct")
    if shock_pct is not None:
        if not isinstance(shock_pct, (int, float)):
            return False, "shock_pct must be a number"
        if shock_pct < -1.0 or shock_pct > 1.0:
            return False, "shock_pct must be between -1.0 and 1.0"

    return True, ""
