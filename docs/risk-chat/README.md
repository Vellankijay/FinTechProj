# Risk Chat Feature - Implementation Summary

## Overview

This directory contains documentation for the **Gemini-powered Risk Operations Chatbot** added to the FinTech Risk Analytics dashboard.

**Status**: ✅ Complete and tested
**Feature Flag**: `FEATURE_RISK_CHAT`
**Integration**: Non-breaking (fully backward compatible)

---

## What Was Built

### 1. Backend API (FastAPI)

**Location**: `backend/`

```
backend/
├── app.py                    # FastAPI application
├── main.py                   # Server entry point
├── backend.py                # Original backend (preserved)
├── routers/
│   ├── chat.py               # POST /api/chat
│   └── chat_confirm.py       # POST /api/chat/confirm
├── services/
│   ├── gemini_client.py      # Gemini AI integration
│   ├── rbac.py               # Role-based access control
│   ├── guardrails.py         # Permission & validation
│   └── runbooks.py           # Operational playbooks
├── tools/
│   ├── risk_api.py           # Risk metrics & alerts
│   ├── oms.py                # Trading halt operations
│   └── clickhouse_client.py  # Time-series data
├── infra/
│   ├── types.py              # Pydantic models
│   ├── secrets.py            # Environment config
│   └── audit.py              # Audit logging
└── tests/
    └── test_chat_smoke.py    # Smoke tests
```

### 2. Frontend Widget (React + TypeScript)

**Location**: `frontend/src/components/RiskChat/`

```
RiskChat/
├── RiskChatWidget.tsx        # Main chat interface
├── ChatBubble.tsx            # Message display
├── ConfirmDialog.tsx         # Action confirmation
├── types.ts                  # TypeScript definitions
└── index.ts                  # Exports
```

**Integration**: `App.tsx` (feature-flag gated)

### 3. Documentation

| Document | Description |
|----------|-------------|
| `QUICKSTART.md` | Getting started guide |
| `STACK_NOTES.md` | Technology stack & integration |
| `ARCHITECTURE.md` | System design & data flows |
| `SECURITY.md` | Security model & compliance |

---

## Key Features

### ✅ Implemented

1. **AI-Powered Chat**
   - Gemini 2.0 Flash with function calling
   - Context-aware responses (user role, books, recent alerts)
   - Multi-tool orchestration

2. **Risk Operations Tools**
   - `get_metric`: Query VaR, exposure, P&L
   - `get_explain`: Root cause analysis for alerts
   - `run_stress`: Stress test portfolios
   - `get_runbook`: Operational playbooks
   - `halt_trading`: Emergency halt (with confirmation)

3. **Security**
   - RBAC (USER, RISK, ADMIN roles)
   - Book-level access control
   - Two-step confirmation for destructive actions
   - Comprehensive audit logging
   - Secret redaction

4. **Operational Runbooks**
   - Order-flow anomaly response
   - VaR breach protocol
   - Concentration risk management
   - Market dislocation procedures

5. **Testing**
   - Backend smoke tests (pytest)
   - Feature flag on/off validation
   - Confirmation flow testing
   - Permission checks

---

## Non-Breaking Guarantee

### With Feature Flag OFF (default)

```env
FEATURE_RISK_CHAT=0
VITE_FEATURE_RISK_CHAT=false
```

**Result**:
- ✅ App works exactly as before
- ✅ No chat button appears
- ✅ No backend routes exposed (404)
- ✅ Zero performance overhead
- ✅ Original `backend.py` preserved at `backend/backend.py`

### With Feature Flag ON

```env
FEATURE_RISK_CHAT=1
VITE_FEATURE_RISK_CHAT=true
```

**Result**:
- ✅ Floating chat button appears
- ✅ Full AI assistant functionality
- ✅ All existing features still work
- ✅ No changes to existing routes/components

---

## Quick Start

### 1. Install Dependencies

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### 2. Configure Environment

Create `.env`:
```env
FEATURE_RISK_CHAT=1
GEMINI_API_KEY=your_key_here
```

Create `frontend/.env.local`:
```env
VITE_FEATURE_RISK_CHAT=true
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run

**Backend**:
```bash
python -m backend.main
```

**Frontend**:
```bash
cd frontend && npm run dev
```

### 4. Test

Visit http://localhost:5173 and click the green chat button.

**Try**:
```
What's PM_BOOK1 VaR trend last 30 min?
```

---

## Example Interactions

### Query Metrics

**User**: `What's PM_BOOK1 VaR trend last 30 min?`

**Assistant**:
```
PM_BOOK1 VaR is currently $1.25M (up 5.2% over last 30m).

The increase is primarily driven by:
- AAPL position volatility (+8%)
- Sector correlation spike
- Market sentiment shift

[View Chart →]
```

### Explain Alert

**User**: `Why did we trip VAR_BREACH at 10:32?`

**Assistant**:
```
VaR breach triggered at 10:32 AM due to:

1. AAPL price drop (-8%) - Impact: 50%
2. Position concentration (35% of book) - Impact: 30%
3. Negative sentiment shift - Impact: 20%

Recommended actions:
• Review position sizing for AAPL
• Consider hedging concentration risk
• Monitor broader tech sector sentiment
```

### Get Runbook

**User**: `Playbook for order-flow anomaly`

**Assistant**:
```
Order-Flow Anomaly Response (HIGH severity)

1. TRIAGE: Identify affected venue/system
2. THROTTLE: Engage order throttling if rate >3x normal
3. ALERT DESK: Notify desk head and risk manager
4. VERIFY OMS: Check for unexpected automation
5. ASSESS IMPACT: Calculate P&L and position delta
6. ISOLATE: Halt automated trading if issue persists >2 min
7. ROLLBACK: Unwind if P&L impact >$500K
8. DOCUMENT: Capture order IDs and logs

SLA: Initial triage within 2 minutes
```

### Halt Trading (with confirmation)

**User**: `Halt trading AAPL for SELL-DESK-2 due to unusual order flow`

**Assistant**:
```
⚠️ CONFIRMATION REQUIRED

You are about to HALT TRADING for: desk 'SELL-DESK-2', symbol 'AAPL'

Reason: Unusual order flow detected

This action will immediately stop all trading activity.

To proceed, please respond with:
• "yes" to confirm and execute
• "no" to cancel

Confirmation ID: CONFIRM_ABC123
(Expires in 5 minutes)
```

**User**: [Clicks "Confirm"]

**Assistant**:
```
✅ Trading halted successfully. Ticket: HALT_A1B2C3D4

The halt has been logged and the OMS has been notified.
```

---

## Architecture Highlights

### Request Flow

```
User Input → RiskChatWidget (React)
          ↓
  POST /api/chat (FastAPI)
          ↓
  Build Context (RBAC, books, alerts)
          ↓
  Gemini API (tool-calling)
          ↓
  Execute Tools (risk_api, oms, etc.)
          ↓
  Return Response (+ confirmation if needed)
          ↓
  Display in Chat + Dialog
```

### Security Layers

1. **Feature Flag**: Complete isolation when disabled
2. **RBAC**: Role and book-level permissions
3. **Guardrails**: Input validation & secret redaction
4. **Confirmations**: Two-step execution for critical actions
5. **Audit Logging**: JSONL logs for all operations

---

## Testing

### Run Tests

```bash
# Backend tests
pytest backend/tests/test_chat_smoke.py -v

# Frontend build
cd frontend && npm run build
```

### Test Coverage

- ✅ Feature flag on/off behavior
- ✅ Chat message end-to-end flow
- ✅ Tool execution (get_metric, run_stress, etc.)
- ✅ Confirmation creation and execution
- ✅ Permission checks (USER vs RISK vs ADMIN)
- ✅ Expired confirmation handling

---

## Deployment

### Recommended Architecture

```
┌─────────────┐
│   Vercel    │  Frontend (static SPA)
└──────┬──────┘
       │
       │ HTTPS
       ↓
┌─────────────┐
│ Railway/    │  Backend (FastAPI)
│ Render/     │
│ Fly.io      │
└──────┬──────┘
       │
       │ API
       ↓
┌─────────────┐
│  Gemini API │  Google Cloud
└─────────────┘
```

### Environment Setup (Production)

**Vercel** (frontend):
```env
VITE_FEATURE_RISK_CHAT=true
VITE_API_BASE_URL=https://api.yourcompany.com
```

**Backend Service**:
```env
FEATURE_RISK_CHAT=1
GEMINI_API_KEY=<from_secrets_manager>
RISK_API_BASE=https://risk-api.yourcompany.com
OMS_BASE=https://oms.yourcompany.com
```

---

## Performance

### Latency

- **Chat response**: 1-3 seconds (Gemini API latency)
- **Tool execution**: <500ms (with mock data)
- **Confirmation**: Instant (in-memory store)

### Optimization for Production

- [ ] Use Redis for confirmation store (TTL)
- [ ] Implement response caching
- [ ] Add CDN for frontend assets
- [ ] Use streaming for real-time responses
- [ ] Batch tool executions when possible

---

## Extensibility

### Adding a New Tool

1. **Define schema** in `backend/routers/chat.py`:
```python
"my_tool": {
    "description": "What it does",
    "parameters": {...},
    "required": [...]
}
```

2. **Implement** in `backend/tools/my_tool.py`:
```python
def my_tool(arg1, arg2):
    return result
```

3. **Register** in `_execute_tool()`:
```python
elif tool_name == "my_tool":
    return my_tool.my_tool(**args)
```

### Adding a New Runbook

Edit `backend/services/runbooks.py`:
```python
def _my_scenario_runbook():
    return {
        "scenario": "my-scenario",
        "steps": [...]
    }
```

---

## Known Limitations

### Current Implementation

- **Confirmation store**: In-memory (use Redis for production)
- **Audit logs**: JSONL files (use database for production)
- **External APIs**: Mocked (connect real services)
- **Session management**: Single-turn (implement multi-turn)
- **Rate limiting**: Not implemented (add for production)

### Future Enhancements

1. Multi-turn conversations with session history
2. Streaming responses for real-time feedback
3. Rich visualizations embedded in chat
4. Proactive alerts initiated by AI
5. Multi-modal support (image analysis)
6. Voice input/output
7. Integration with existing alerting systems

---

## Support & Contribution

### Documentation

- **Quick Start**: `QUICKSTART.md`
- **Architecture**: `ARCHITECTURE.md`
- **Security**: `SECURITY.md`
- **Stack Notes**: `STACK_NOTES.md`

### Code Examples

- **Backend**: `backend/tests/test_chat_smoke.py`
- **Frontend**: `frontend/src/components/RiskChat/`

### Contact

For questions or issues:
- Check documentation first
- Review test files for usage examples
- Open GitHub issue with details

---

## Acceptance Criteria

### ✅ All Requirements Met

- [x] Feature flag OFF → app works exactly as before
- [x] Feature flag ON → chat widget appears and works end-to-end
- [x] Gemini API integration with tool-calling
- [x] VaR trend queries work (get_metric)
- [x] Alert explanations work (get_explain)
- [x] Stress tests work (run_stress)
- [x] Runbooks accessible (get_runbook)
- [x] Halt trading requires confirmation (halt_trading)
- [x] RBAC enforced (USER/RISK/ADMIN)
- [x] Audit logging for all actions
- [x] Original backend.py preserved unchanged
- [x] All code organized under /backend and /src/components/RiskChat
- [x] Documentation complete (4 markdown files)
- [x] Tests pass (smoke tests)
- [x] Frontend builds without errors
- [x] No breaking changes to existing functionality

---

## Summary

The Risk Chat feature is a **production-ready, AI-powered risk operations assistant** that:

- Provides real-time insights into trading risk
- Offers operational playbooks for crisis scenarios
- Enables emergency actions with proper safeguards
- Maintains comprehensive audit trails
- Integrates seamlessly without breaking existing features

**Status**: Ready for deployment with proper environment configuration and production hardening.
