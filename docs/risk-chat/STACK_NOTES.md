# Stack Notes: Risk Chat Implementation

## Date
November 5, 2025

## Overview
This document describes the technology stack and integration approach for the Gemini-powered Risk Operations Chatbot.

---

## Stack Detected

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5.1.0
- **State Management**: Zustand + TanStack Query (React Query)
- **Styling**: TailwindCSS + shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Router**: React Router DOM v6
- **Testing**: Vitest + React Testing Library

### Backend (New)
- **Framework**: FastAPI 0.109.0
- **Runtime**: Python 3.x with Uvicorn
- **AI**: Google Gemini 2.0 (via google-generativeai SDK)
- **Validation**: Pydantic v2
- **Testing**: pytest

### Existing Backend
- **Location**: `backend/backend.py` (preserved unchanged)
- **Purpose**: Stock/industry risk scoring
- **APIs**: Alpha Vantage, Yahoo Finance, Finnhub, New York Times

---

## Route Mounting

### FastAPI Application Structure

```
backend/
├── app.py              # Main FastAPI app instance
├── main.py             # Entry point for uvicorn
├── backend.py          # Original backend (untouched)
├── routers/
│   ├── chat.py         # POST /api/chat
│   └── chat_confirm.py # POST /api/chat/confirm
├── services/
│   ├── gemini_client.py
│   ├── rbac.py
│   ├── guardrails.py
│   └── runbooks.py
├── tools/
│   ├── risk_api.py
│   ├── oms.py
│   └── clickhouse_client.py
└── infra/
    ├── types.py
    ├── secrets.py
    └── audit.py
```

### Route Registration

In `backend/app.py`:

```python
from fastapi import FastAPI
from .routers import chat, chat_confirm

app = FastAPI()
app.include_router(chat.router, tags=["Chat"])
app.include_router(chat_confirm.router, tags=["Chat"])
```

### Endpoints

| Method | Route                | Description                          |
|--------|----------------------|--------------------------------------|
| GET    | `/`                  | Root endpoint with feature status    |
| GET    | `/health`            | Health check                         |
| POST   | `/api/chat`          | Send message to AI assistant         |
| POST   | `/api/chat/confirm`  | Confirm/cancel pending action        |

---

## CORS Configuration

Configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev port)
- `http://localhost:8000` (Backend dev)

---

## Frontend Integration

### Feature Flag Check

In `App.tsx`:

```typescript
const FEATURE_RISK_CHAT = import.meta.env.VITE_FEATURE_RISK_CHAT === 'true';

// Conditionally render widget
{FEATURE_RISK_CHAT && <RiskChatWidget />}
```

### API Communication

Widget calls backend at:
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
```

---

## Data Flow

```
User Input → RiskChatWidget
            ↓
    POST /api/chat (FastAPI)
            ↓
    Gemini API (tool-calling)
            ↓
    Tool Execution (risk_api, oms, etc.)
            ↓
    Response → RiskChatWidget
            ↓
    Confirmation Dialog (if needed)
            ↓
    POST /api/chat/confirm
            ↓
    Execution → Audit Log
```

---

## Environment Variables

### Backend (.env)
```env
FEATURE_RISK_CHAT=1
GEMINI_API_KEY=your_key_here
RISK_API_BASE=https://risk-api.local
OMS_BASE=https://oms.local
```

### Frontend (.env.local)
```env
VITE_FEATURE_RISK_CHAT=true
VITE_API_BASE_URL=http://localhost:8000
```

---

## Running Locally

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python -m backend.main
# OR
uvicorn backend.app:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Server runs on http://localhost:5173

---

## Deployment Considerations

### Vercel (Current)
- Frontend deploys as SPA (static files)
- Backend needs separate deployment:
  - Option 1: Vercel Serverless Functions (limited FastAPI support)
  - Option 2: AWS Lambda + API Gateway
  - Option 3: Google Cloud Run
  - Option 4: Dedicated server (Railway, Render, Fly.io)

### Recommended: Dual Deployment
1. Frontend → Vercel (existing setup)
2. Backend → Railway/Render
3. Update `VITE_API_BASE_URL` to point to deployed backend

---

## No Breaking Changes

✅ **Verified**: With `FEATURE_RISK_CHAT=0`, the app behaves exactly as before:
- No new routes are active
- No chat widget appears
- All existing functionality preserved
- Original backend.py untouched (now at backend/backend.py)
