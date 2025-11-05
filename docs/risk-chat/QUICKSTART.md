# Quick Start Guide: Risk Chat Feature

## Prerequisites

- Python 3.9+ with pip
- Node.js 18+ with npm
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

---

## Installation

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/Vellankijay/FinTechProj.git
cd FinTechProj

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Running WITHOUT Risk Chat (Default)

The app works exactly as before when the feature flag is off.

### Start Frontend Only

```bash
cd frontend
npm run dev
```

Visit http://localhost:5173

---

## Running WITH Risk Chat Feature

### 1. Set Up Environment

Create `.env` file in project root:

```env
# Enable Risk Chat
FEATURE_RISK_CHAT=1

# Add your Gemini API key
GEMINI_API_KEY=your_actual_api_key_here

# Mock service endpoints (for demo)
RISK_API_BASE=https://risk-api.local
OMS_BASE=https://oms.local
ALERT_TOPIC=alerts.events
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

Create `frontend/.env.local`:

```env
# Enable Risk Chat in frontend
VITE_FEATURE_RISK_CHAT=true

# Point to local backend
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Start Backend

```bash
# From project root
python -m backend.main
```

Backend runs on http://localhost:8000

### 3. Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173

---

## Using the Risk Chat

### 1. Open the App

Visit http://localhost:5173

### 2. Click the Chat Button

Look for the floating green chat button in the bottom-right corner.

### 3. Try These Queries

**Query Metrics**:
```
What's PM_BOOK1 VaR trend last 30 min?
```

**Explain Alerts**:
```
Why did we trip VAR_BREACH at 10:32?
```

**Stress Testing**:
```
Run a stress test on PM_BOOK1 with -10% shock
```

**Get Runbooks**:
```
Playbook for order-flow anomaly
```

**Halt Trading** (requires confirmation):
```
Halt trading AAPL for SELL-DESK-2 due to unusual order flow
```

---

## Demo User Roles

The system includes demo users with different permission levels:

| User ID | Role    | Books Access                          | Can Halt Trading? |
|---------|---------|--------------------------------------|-------------------|
| `demo`  | `RISK`  | PM_BOOK1, TECH_DESK, HEALTH_DESK     | ✅ Yes            |
| `user1` | `USER`  | PM_BOOK1                             | ❌ No             |
| `admin1`| `ADMIN` | All books                            | ✅ Yes            |

To test different roles, edit `USER_ID` in:
`frontend/src/components/RiskChat/RiskChatWidget.tsx`

```typescript
const USER_ID = 'demo'  // Change to 'user1' or 'admin1'
```

---

## Testing

### Backend Tests

```bash
pytest backend/tests/test_chat_smoke.py -v
```

**Tests include**:
- Feature flag on/off behavior
- Chat message flow
- Confirmation mechanism
- Permission checks

### Frontend Tests

```bash
cd frontend
npm run test
```

---

## Troubleshooting

### "Risk chat feature is not enabled"

**Problem**: Backend feature flag is off

**Solution**:
```bash
export FEATURE_RISK_CHAT=1  # Linux/Mac
set FEATURE_RISK_CHAT=1     # Windows
```

### Chat button doesn't appear

**Problem**: Frontend feature flag is off

**Solution**: Check `frontend/.env.local`:
```env
VITE_FEATURE_RISK_CHAT=true
```

Restart frontend dev server.

### "Failed to send message"

**Problem**: Backend not running or wrong URL

**Solution**:
1. Check backend is running on port 8000
2. Verify `VITE_API_BASE_URL=http://localhost:8000` in `frontend/.env.local`

### "Missing required environment variable: GEMINI_API_KEY"

**Problem**: Gemini API key not set

**Solution**: Add to `.env`:
```env
GEMINI_API_KEY=your_key_here
```

Get a key from: https://aistudio.google.com/app/apikey

---

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │  (Port 5173)
│  + Chat Widget  │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│  FastAPI Backend│  (Port 8000)
│  + Gemini API   │
└─────────────────┘
```

---

## Next Steps

1. **Read Architecture**: `docs/risk-chat/ARCHITECTURE.md`
2. **Review Security**: `docs/risk-chat/SECURITY.md`
3. **Explore Code**: Start with `backend/routers/chat.py`
4. **Add Custom Tools**: See "Extensibility" in ARCHITECTURE.md
5. **Deploy to Production**: See STACK_NOTES.md for deployment options

---

## Support

For issues or questions:
- Check `docs/risk-chat/` documentation
- Review `backend/tests/` for usage examples
- Open an issue on GitHub
