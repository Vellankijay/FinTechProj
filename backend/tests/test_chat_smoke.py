"""
Smoke tests for Risk Chat feature.

Run with: pytest backend/tests/test_chat_smoke.py
"""
import os
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client."""
    from backend.app import app
    return TestClient(app)


def test_feature_flag_off(client, monkeypatch):
    """Test that chat endpoint returns 404 when feature flag is off."""
    # Set feature flag to off
    monkeypatch.setenv("FEATURE_RISK_CHAT", "0")

    # Reload config
    from backend.infra import secrets
    import importlib
    importlib.reload(secrets)

    response = client.post(
        "/api/chat",
        json={"user_id": "test_user", "text": "Hello"}
    )

    assert response.status_code == 404
    assert "not enabled" in response.json()["detail"].lower()


def test_feature_flag_on(client, monkeypatch):
    """Test that chat endpoint works when feature flag is on."""
    # Set feature flag to on
    monkeypatch.setenv("FEATURE_RISK_CHAT", "1")
    monkeypatch.setenv("GEMINI_API_KEY", "test_key_12345")

    # Reload config
    from backend.infra import secrets
    import importlib
    importlib.reload(secrets)

    response = client.post(
        "/api/chat",
        json={"user_id": "test_user", "text": "What is PM_BOOK1 VaR?"}
    )

    # Should return 200 or 500 (Gemini API error with fake key)
    # but NOT 404
    assert response.status_code != 404


def test_chat_basic_flow(client, monkeypatch):
    """Test basic chat flow with mock response."""
    monkeypatch.setenv("FEATURE_RISK_CHAT", "1")
    monkeypatch.setenv("GEMINI_API_KEY", "test_key")

    # Mock Gemini client
    from backend.services import gemini_client
    from backend.infra.types import GeminiResponse

    original_chat = gemini_client.chat_with_tools

    def mock_chat(*args, **kwargs):
        return GeminiResponse(
            text="PM_BOOK1 VaR is currently $1.25M, up 5.2% in the last 30 minutes.",
            tool_calls=[]
        )

    monkeypatch.setattr(gemini_client, "chat_with_tools", mock_chat)

    response = client.post(
        "/api/chat",
        json={"user_id": "demo", "text": "What is PM_BOOK1 VaR?"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    assert len(data["text"]) > 0


def test_halt_trading_requires_confirmation(client, monkeypatch):
    """Test that halt_trading action returns confirmation prompt."""
    monkeypatch.setenv("FEATURE_RISK_CHAT", "1")
    monkeypatch.setenv("GEMINI_API_KEY", "test_key")

    # Mock Gemini to return halt_trading tool call
    from backend.services import gemini_client
    from backend.infra.types import GeminiResponse, ToolCall

    def mock_chat(*args, **kwargs):
        return GeminiResponse(
            text="I'll halt trading for that book.",
            tool_calls=[
                ToolCall(
                    name="halt_trading",
                    args={
                        "book": "PM_BOOK1",
                        "reason": "Testing halt functionality for smoke test"
                    }
                )
            ]
        )

    monkeypatch.setattr(gemini_client, "chat_with_tools", mock_chat)

    response = client.post(
        "/api/chat",
        json={"user_id": "demo", "text": "Halt trading for PM_BOOK1"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "confirm_id" in data
    assert "CONFIRM_" in data["confirm_id"]
    assert "CONFIRMATION REQUIRED" in data["text"]


def test_confirmation_yes_executes_action(client, monkeypatch):
    """Test that confirming 'yes' executes the action."""
    monkeypatch.setenv("FEATURE_RISK_CHAT", "1")

    # First, create a pending confirmation
    from backend.routers.chat import _pending_confirmations
    import time

    confirm_id = "TEST_CONFIRM_123"
    _pending_confirmations[confirm_id] = {
        "user_id": "demo",
        "tool_name": "halt_trading",
        "tool_args": {
            "book": "PM_BOOK1",
            "reason": "Test reason for confirmation"
        },
        "created_at": time.time(),
        "expires_at": time.time() + 300,
    }

    # Confirm with 'yes'
    response = client.post(
        "/api/chat/confirm",
        json={
            "user_id": "demo",
            "confirm_id": confirm_id,
            "answer": "yes"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "executed"
    assert "ticket_id" in data


def test_confirmation_no_cancels_action(client, monkeypatch):
    """Test that confirming 'no' cancels the action."""
    monkeypatch.setenv("FEATURE_RISK_CHAT", "1")

    # Create a pending confirmation
    from backend.routers.chat import _pending_confirmations
    import time

    confirm_id = "TEST_CONFIRM_456"
    _pending_confirmations[confirm_id] = {
        "user_id": "demo",
        "tool_name": "halt_trading",
        "tool_args": {"book": "PM_BOOK1", "reason": "Test"},
        "created_at": time.time(),
        "expires_at": time.time() + 300,
    }

    # Cancel with 'no'
    response = client.post(
        "/api/chat/confirm",
        json={
            "user_id": "demo",
            "confirm_id": confirm_id,
            "answer": "no"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cancelled"


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "features" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
