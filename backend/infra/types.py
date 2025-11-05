"""
Pydantic models for API schemas and tool definitions.
"""
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


# ===== Request/Response Models =====

class ChatRequest(BaseModel):
    """Request body for /api/chat endpoint."""
    user_id: str = Field(..., description="User identifier")
    text: str = Field(..., description="User message text")
    session_id: Optional[str] = Field(None, description="Optional session ID for conversation continuity")


class ChatResponse(BaseModel):
    """Response from /api/chat endpoint."""
    text: str = Field(..., description="Assistant response text")
    confirm_id: Optional[str] = Field(None, description="Confirmation ID if action requires approval")
    spark_viz_url: Optional[str] = Field(None, description="URL to visualization/chart")
    session_id: Optional[str] = Field(None, description="Session ID for conversation tracking")


class ConfirmRequest(BaseModel):
    """Request body for /api/chat/confirm endpoint."""
    user_id: str = Field(..., description="User identifier")
    confirm_id: str = Field(..., description="Confirmation ID from previous chat response")
    answer: Literal["yes", "no"] = Field(..., description="User's confirmation answer")


class ConfirmResponse(BaseModel):
    """Response from /api/chat/confirm endpoint."""
    status: str = Field(..., description="Status of confirmation (executed, cancelled, error)")
    ticket_id: Optional[str] = Field(None, description="Ticket/transaction ID if executed")
    message: str = Field(..., description="Human-readable message")


# ===== Tool Call Models =====

class ToolCall(BaseModel):
    """Represents a tool call from Gemini."""
    name: str = Field(..., description="Tool function name")
    args: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")


class ToolResult(BaseModel):
    """Result from executing a tool."""
    success: bool = Field(..., description="Whether tool execution succeeded")
    data: Optional[Any] = Field(None, description="Tool result data")
    error: Optional[str] = Field(None, description="Error message if failed")


# ===== Tool Schema Definitions =====

class GetMetricArgs(BaseModel):
    """Arguments for get_metric tool."""
    book: str = Field(..., description="Book/portfolio identifier")
    metric: str = Field(..., description="Metric name (e.g., 'VaR', 'Exposure', 'PnL')")
    window: str = Field(default="30m", description="Time window (e.g., '30m', '1h', '1d')")


class GetExplainArgs(BaseModel):
    """Arguments for get_explain tool."""
    alert_id: str = Field(..., description="Alert identifier to explain")


class RunStressArgs(BaseModel):
    """Arguments for run_stress tool."""
    book: str = Field(..., description="Book/portfolio to stress test")
    scenario_id: Optional[str] = Field(None, description="Predefined scenario ID")
    shock_pct: Optional[float] = Field(None, description="Custom shock percentage (e.g., -0.1 for -10%)")


class HaltTradingArgs(BaseModel):
    """Arguments for halt_trading tool (requires confirmation)."""
    desk: Optional[str] = Field(None, description="Desk to halt")
    book: Optional[str] = Field(None, description="Book to halt")
    symbol: Optional[str] = Field(None, description="Symbol to halt")
    reason: str = Field(..., description="Reason for halting trading")


# ===== Confirmation Store Models =====

class PendingConfirmation(BaseModel):
    """Pending confirmation data stored in KV."""
    user_id: str
    tool_name: str
    tool_args: Dict[str, Any]
    created_at: float
    expires_at: float


# ===== Context Models =====

class ChatContext(BaseModel):
    """Context passed to Gemini for enriched responses."""
    user_role: str = Field(..., description="User role (USER, RISK, ADMIN)")
    books: List[str] = Field(default_factory=list, description="Books user has access to")
    recent_alerts: List[Dict[str, Any]] = Field(default_factory=list, description="Recent alerts")
    spark_viz_url: Optional[str] = Field(None, description="Spark visualization URL")


# ===== Gemini API Models =====

class GeminiMessage(BaseModel):
    """Message format for Gemini API."""
    role: Literal["user", "assistant", "system"] = Field(..., description="Message role")
    content: str = Field(..., description="Message content")


class GeminiResponse(BaseModel):
    """Response from Gemini chat_with_tools."""
    text: str = Field(..., description="Generated text response")
    tool_calls: List[ToolCall] = Field(default_factory=list, description="Tool calls to execute")


# ===== Audit Models =====

class AuditLog(BaseModel):
    """Audit log entry."""
    timestamp: float
    user_id: str
    action: str
    details: Dict[str, Any]
    result: str
