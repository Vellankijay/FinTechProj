"""
Secrets and configuration management with validation.
"""
import os
from typing import Optional


def vault(key: str, required: bool = True) -> Optional[str]:
    """
    Retrieve environment variable with validation.

    Args:
        key: Environment variable name
        required: If True, raises ValueError when missing

    Returns:
        Environment variable value or None if not required

    Raises:
        ValueError: If required key is missing
    """
    value = os.getenv(key)

    if required and not value:
        raise ValueError(
            f"Missing required environment variable: {key}. "
            f"Please set it in your .env file or environment."
        )

    return value


def get_config():
    """Get all configuration values with validation."""
    return {
        # Feature flags
        "FEATURE_RISK_CHAT": os.getenv("FEATURE_RISK_CHAT", "0") == "1",

        # API keys
        "GEMINI_API_KEY": vault("GEMINI_API_KEY", required=False),

        # Service endpoints
        "RISK_API_BASE": os.getenv("RISK_API_BASE", "https://risk-api.local"),
        "OMS_BASE": os.getenv("OMS_BASE", "https://oms.local"),

        # Messaging
        "ALERT_TOPIC": os.getenv("ALERT_TOPIC", "alerts.events"),

        # ClickHouse
        "CLICKHOUSE_URL": os.getenv("CLICKHOUSE_URL", "http://localhost:8123"),
        "CLICKHOUSE_USER": os.getenv("CLICKHOUSE_USER", "default"),
        "CLICKHOUSE_PASSWORD": os.getenv("CLICKHOUSE_PASSWORD", ""),
    }
