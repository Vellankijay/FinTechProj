# Architecture: Risk Chat System

## System Overview

The Risk Chat system is an AI-powered assistant for real-time trading risk operations, built with Gemini 2.0 and integrated into the FinTech dashboard.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RiskChatWidget                                       │  │
│  │  - Message input/display                              │  │
│  │  - Confirmation dialogs                               │  │
│  │  - Feature flag gated                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│                    (HTTP POST/GET)                           │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/chat                                            │  │
│  │  - Validate feature flag                              │  │
│  │  - Build context (RBAC, books, alerts)                │  │
│  │  - Call Gemini with tools                             │  │
│  │  - Handle tool execution                              │  │
│  │  - Create confirmations for destructive actions       │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Gemini Client                                        │  │
│  │  - Format prompts with context                        │  │
│  │  - Send function declarations                         │  │
│  │  - Parse tool calls                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tool Registry                                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │  │
│  │  │ get_     │ │ run_     │ │ halt_    │              │  │
│  │  │ metric   │ │ stress   │ │ trading  │ (+ more)     │  │
│  │  └──────────┘ └──────────┘ └──────────┘              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services & Guardrails                                │  │
│  │  - RBAC (role + book access)                          │  │
│  │  - Guardrails (permission checks, validation)         │  │
│  │  - Runbooks (operational playbooks)                   │  │
│  │  - Audit logging (JSONL)                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  External Integrations (Mock for demo)                │  │
│  │  - Risk API (metrics, alerts, stress tests)           │  │
│  │  - OMS (halt/resume trading)                          │  │
│  │  - ClickHouse (time-series data)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   GEMINI API                                 │
│  - google.generativeai SDK                                  │
│  - Model: gemini-2.0-flash-exp                              │
│  - Function calling enabled                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Flow: Chat Message

### 1. User Sends Message

```
User types: "What's PM_BOOK1 VaR trend last 30 min?"
         ↓
RiskChatWidget.sendMessage()
         ↓
POST /api/chat
{
  "user_id": "demo",
  "text": "What's PM_BOOK1 VaR trend last 30 min?"
}
```

### 2. Backend Processing

```python
# chat.py
@router.post("/api/chat")
async def chat(request: ChatRequest):
    # 1. Check feature flag
    if not config["FEATURE_RISK_CHAT"]:
        return 404

    # 2. Build context
    context = {
        "user_role": "RISK",
        "books": ["PM_BOOK1", "TECH_DESK"],
        "recent_alerts": [...],
        "spark_viz_url": "http://..."
    }

    # 3. Call Gemini with tools
    gem_response = gemini_client.chat_with_tools(
        system=SYSTEM_PROMPT,
        tools=TOOL_DEFINITIONS,
        context=context,
        messages=[{"role": "user", "content": request.text}]
    )

    # 4. Process tool calls
    for tool_call in gem_response.tool_calls:
        if tool_call.name == "halt_trading":
            # Create confirmation
            return ChatResponse(
                text="⚠️ CONFIRMATION REQUIRED...",
                confirm_id="CONFIRM_ABC123"
            )
        else:
            # Execute immediately
            result = execute_tool(tool_call.name, tool_call.args)
            # Get final response
            final = gemini_client.continue_with_tool_result(...)
            return ChatResponse(text=final.text)
```

### 3. Gemini Processing

```
Gemini receives:
- System prompt
- Context (user role, books, recent alerts)
- Tool definitions (get_metric, run_stress, etc.)
- User message

Gemini decides:
"User wants VaR trend → I should call get_metric tool"

Returns:
{
  "text": "Checking VaR for PM_BOOK1...",
  "tool_calls": [
    {
      "name": "get_metric",
      "args": {"book": "PM_BOOK1", "metric": "VaR", "window": "30m"}
    }
  ]
}
```

### 4. Tool Execution

```python
# Execute get_metric
result = risk_api.get_metric(
    book="PM_BOOK1",
    metric="VaR",
    window="30m"
)

# Result:
{
  "value": 1250000,
  "trend": "up",
  "change_pct": 5.2,
  "history": [...]
}

# Send back to Gemini for summarization
final = gemini_client.continue_with_tool_result(
    ...,
    tool_name="get_metric",
    tool_result=result
)

# Gemini responds:
"PM_BOOK1 VaR is currently $1.25M (up 5.2% over last 30m).
The spike is driven by increased volatility in AAPL holdings."
```

### 5. Response to Frontend

```json
{
  "text": "PM_BOOK1 VaR is currently $1.25M (up 5.2% over last 30m)...",
  "spark_viz_url": "http://risk-api.local/charts?books=PM_BOOK1&metric=VaR",
  "session_id": null
}
```

---

## Confirmation Flow: Halt Trading

### 1. User Request

```
User: "Halt trading for AAPL on SELL-DESK-2 due to unusual order flow"
```

### 2. Gemini Tool Call

```json
{
  "tool_calls": [
    {
      "name": "halt_trading",
      "args": {
        "desk": "SELL-DESK-2",
        "symbol": "AAPL",
        "reason": "Unusual order flow detected"
      }
    }
  ]
}
```

### 3. Backend Creates Confirmation

```python
# chat.py
if tool_name == "halt_trading":
    # Check RBAC
    if not guardrails.can_execute(user_id, "halt_trading"):
        return "You lack permission..."

    # Validate args
    is_valid, error = guardrails.validate_halt_trading_args(args)

    # Create confirmation
    confirm_id = "CONFIRM_XYZ789"
    _pending_confirmations[confirm_id] = {
        "user_id": user_id,
        "tool_name": "halt_trading",
        "tool_args": args,
        "expires_at": time.time() + 300
    }

    return ChatResponse(
        text="⚠️ CONFIRMATION REQUIRED\n\nYou are about to HALT...",
        confirm_id=confirm_id
    )
```

### 4. Frontend Shows Dialog

```tsx
<ConfirmDialog
  message="⚠️ CONFIRMATION REQUIRED..."
  onConfirm={() => handleConfirm('yes')}
  onCancel={() => handleConfirm('no')}
/>
```

### 5. User Confirms

```
POST /api/chat/confirm
{
  "user_id": "demo",
  "confirm_id": "CONFIRM_XYZ789",
  "answer": "yes"
}
```

### 6. Backend Executes

```python
# chat_confirm.py
@router.post("/api/chat/confirm")
async def confirm_action(request: ConfirmRequest):
    # Validate confirmation exists and belongs to user
    confirm_data = _pending_confirmations[request.confirm_id]

    if request.answer == "yes":
        # Execute tool
        result = oms.halt_trading(
            user_id=user_id,
            desk="SELL-DESK-2",
            symbol="AAPL",
            reason="Unusual order flow detected"
        )

        # Audit log created in oms.halt_trading()

        return ConfirmResponse(
            status="executed",
            ticket_id="HALT_A1B2C3D4",
            message="Trading halted. Ticket: HALT_A1B2C3D4"
        )
```

---

## Security Layers

### 1. Feature Flag
```python
if not config["FEATURE_RISK_CHAT"]:
    raise HTTPException(404)
```

### 2. RBAC (Role-Based Access Control)
```python
user_role = rbac.get_role(user_id)  # USER | RISK | ADMIN
user_books = rbac.get_books(user_id)  # ["PM_BOOK1", ...]
```

### 3. Guardrails
```python
# Permission check
if not guardrails.can_execute(user_id, "halt_trading"):
    return "Permission denied"

# Argument validation
is_valid, error = guardrails.validate_halt_trading_args(args)

# Secret redaction
safe_payload = guardrails.redact(payload)
```

### 4. Confirmation Mechanism
- Destructive actions require explicit user confirmation
- Confirmation IDs expire in 5 minutes
- Ownership validation (user can only confirm their own requests)

### 5. Audit Trail
```python
audit.log(
    user_id="demo",
    action="halt_trading",
    details={"ticket_id": "...", "symbol": "AAPL", ...},
    result="success"
)
```

---

## Extensibility

### Adding New Tools

1. **Define schema in `chat.py`**:
```python
"my_new_tool": {
    "description": "What this tool does",
    "parameters": {...},
    "required": [...]
}
```

2. **Implement tool wrapper**:
```python
# backend/tools/my_tool.py
def my_new_tool(arg1, arg2):
    # Implementation
    return result
```

3. **Register in `_execute_tool()`**:
```python
elif tool_name == "my_new_tool":
    return my_tool.my_new_tool(**args)
```

### Adding New Runbooks

Edit `backend/services/runbooks.py`:
```python
def _my_new_scenario_runbook():
    return {
        "scenario": "my-scenario",
        "steps": [...]
    }
```

---

## Performance Considerations

- **Gemini API latency**: 1-3 seconds typical
- **Tool execution**: <500ms for mock data
- **Confirmation storage**: In-memory (use Redis for production)
- **Audit logs**: Append-only JSONL (consider database for production)

---

## Future Enhancements

1. **Session management**: Multi-turn conversations
2. **Streaming responses**: Real-time token streaming
3. **Rich visualizations**: Embed charts in chat
4. **Proactive alerts**: AI-initiated notifications
5. **Multi-modal**: Image analysis (screenshot debugging)
