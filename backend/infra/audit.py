"""
Audit logging for tracking user actions and system events.
"""
import json
import time
from pathlib import Path
from typing import Dict, Any
from .types import AuditLog


# Audit log file path
AUDIT_LOG_FILE = Path(__file__).parent.parent / "audit.log"


def log(user_id: str, action: str, details: Dict[str, Any], result: str = "success"):
    """
    Append audit log entry to JSONL file and print to console.

    Args:
        user_id: User who performed the action
        action: Action type (e.g., 'halt_trading', 'query_metric')
        details: Additional details about the action
        result: Result of the action (success, failed, etc.)
    """
    entry = AuditLog(
        timestamp=time.time(),
        user_id=user_id,
        action=action,
        details=details,
        result=result
    )

    # Write to JSONL file
    with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry.model_dump_json() + "\n")

    # Also print to console for debugging
    print(f"[AUDIT] {entry.model_dump_json()}")


def get_recent_logs(limit: int = 100) -> list[AuditLog]:
    """
    Retrieve recent audit logs.

    Args:
        limit: Maximum number of logs to return

    Returns:
        List of audit log entries
    """
    if not AUDIT_LOG_FILE.exists():
        return []

    logs = []
    with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                logs.append(AuditLog.model_validate_json(line))

    # Return most recent first
    return logs[-limit:][::-1]
