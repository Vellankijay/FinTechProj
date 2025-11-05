# Project Structure: Risk Chat Feature

## Overview

This document provides a complete file tree of the Risk Chat implementation.

**Statistics**:
- 22 Python files in `/backend`
- 5 TypeScript/React files in `/frontend/src/components/RiskChat`
- 5 Documentation files in `/docs/risk-chat`
- Total: 32+ new files (all additive, no files removed)

---

## Complete File Tree

```
FinTechProj/
│
├── .env.example                              # Backend environment template (NEW)
├── requirements.txt                          # Python dependencies (NEW)
├── Makefile                                  # Development scripts (NEW)
├── RISK_CHAT_IMPLEMENTATION.md               # Implementation summary (NEW)
├── PROJECT_TREE.md                           # This file (NEW)
│
├── backend/                                  # Backend directory (NEW)
│   ├── __init__.py
│   ├── app.py                                # FastAPI application
│   ├── main.py                               # Server entry point
│   ├── backend.py                            # Original backend (MOVED, UNCHANGED)
│   │
│   ├── routers/                              # API endpoints
│   │   ├── __init__.py
│   │   ├── chat.py                           # POST /api/chat
│   │   └── chat_confirm.py                   # POST /api/chat/confirm
│   │
│   ├── services/                             # Business logic
│   │   ├── __init__.py
│   │   ├── gemini_client.py                  # Gemini API integration
│   │   ├── rbac.py                           # Role-based access control
│   │   ├── guardrails.py                     # Permission & validation
│   │   └── runbooks.py                       # Operational playbooks
│   │
│   ├── tools/                                # Tool wrappers
│   │   ├── __init__.py
│   │   ├── risk_api.py                       # Risk metrics & alerts
│   │   ├── oms.py                            # Order Management System
│   │   └── clickhouse_client.py              # Time-series data
│   │
│   ├── infra/                                # Infrastructure utilities
│   │   ├── __init__.py
│   │   ├── types.py                          # Pydantic models
│   │   ├── secrets.py                        # Environment config
│   │   └── audit.py                          # Audit logging
│   │
│   └── tests/                                # Tests
│       ├── __init__.py
│       └── test_chat_smoke.py                # Smoke tests (pytest)
│
├── frontend/                                 # Frontend (EXISTING)
│   ├── .env.example                          # Environment template (UPDATED)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   │
│   └── src/
│       ├── App.tsx                           # Main app (UPDATED - added feature flag)
│       ├── main.tsx
│       │
│       ├── components/
│       │   ├── RiskChat/                     # Risk Chat components (NEW)
│       │   │   ├── index.ts                  # Component exports
│       │   │   ├── types.ts                  # TypeScript types
│       │   │   ├── RiskChatWidget.tsx        # Main chat UI
│       │   │   ├── ChatBubble.tsx            # Message display
│       │   │   └── ConfirmDialog.tsx         # Confirmation modal
│       │   │
│       │   ├── ui/                           # shadcn/ui components (EXISTING)
│       │   ├── layout/                       # Layout components (EXISTING)
│       │   ├── charts/                       # Chart components (EXISTING)
│       │   └── ...
│       │
│       ├── routes/                           # Pages (EXISTING)
│       │   ├── Home.tsx
│       │   ├── Summary.tsx
│       │   ├── Tech.tsx
│       │   ├── Healthtech.tsx
│       │   └── Settings.tsx
│       │
│       ├── lib/                              # Utilities (EXISTING)
│       ├── store/                            # State management (EXISTING)
│       ├── styles/                           # Styles (EXISTING)
│       └── types/                            # Types (EXISTING)
│
├── docs/                                     # Documentation
│   └── risk-chat/                            # Risk Chat docs (NEW)
│       ├── README.md                         # Feature overview
│       ├── QUICKSTART.md                     # Getting started
│       ├── STACK_NOTES.md                    # Tech stack
│       ├── ARCHITECTURE.md                   # System design
│       └── SECURITY.md                       # Security model
│
├── vercel.json                               # Vercel config (EXISTING)
├── README.md                                 # Project README (EXISTING)
└── .gitignore                                # Git ignore (EXISTING)
```

---

## Files by Category

### Backend Files (22 Python files)

**Core**:
- `backend/__init__.py`
- `backend/app.py` - FastAPI app
- `backend/main.py` - Server entry point
- `backend/backend.py` - Original backend (moved, unchanged)

**Routers** (3 files):
- `backend/routers/__init__.py`
- `backend/routers/chat.py` - Chat endpoint
- `backend/routers/chat_confirm.py` - Confirmation endpoint

**Services** (5 files):
- `backend/services/__init__.py`
- `backend/services/gemini_client.py` - Gemini integration
- `backend/services/rbac.py` - Access control
- `backend/services/guardrails.py` - Validation
- `backend/services/runbooks.py` - Playbooks

**Tools** (4 files):
- `backend/tools/__init__.py`
- `backend/tools/risk_api.py` - Risk API client
- `backend/tools/oms.py` - OMS client
- `backend/tools/clickhouse_client.py` - ClickHouse client

**Infrastructure** (4 files):
- `backend/infra/__init__.py`
- `backend/infra/types.py` - Pydantic models
- `backend/infra/secrets.py` - Config
- `backend/infra/audit.py` - Audit logs

**Tests** (2 files):
- `backend/tests/__init__.py`
- `backend/tests/test_chat_smoke.py` - Smoke tests

### Frontend Files (5 TypeScript files)

**RiskChat Component**:
- `frontend/src/components/RiskChat/index.ts`
- `frontend/src/components/RiskChat/types.ts`
- `frontend/src/components/RiskChat/RiskChatWidget.tsx`
- `frontend/src/components/RiskChat/ChatBubble.tsx`
- `frontend/src/components/RiskChat/ConfirmDialog.tsx`

**Modified Files** (1):
- `frontend/src/App.tsx` - Added feature flag and widget import

### Documentation Files (5 Markdown files)

- `docs/risk-chat/README.md` - Feature overview
- `docs/risk-chat/QUICKSTART.md` - Getting started
- `docs/risk-chat/STACK_NOTES.md` - Tech stack
- `docs/risk-chat/ARCHITECTURE.md` - System design
- `docs/risk-chat/SECURITY.md` - Security model

### Configuration Files (4 files)

- `.env.example` - Backend environment template (NEW)
- `requirements.txt` - Python dependencies (NEW)
- `Makefile` - Development scripts (NEW)
- `frontend/.env.example` - Frontend environment (UPDATED)

### Root Documentation (2 files)

- `RISK_CHAT_IMPLEMENTATION.md` - Implementation summary (NEW)
- `PROJECT_TREE.md` - This file (NEW)

---

## Original Files (UNCHANGED)

The following original files remain completely unchanged:

**Root**:
- `vercel.json`
- `README.md`
- `.gitignore`

**Frontend** (all existing files except App.tsx and .env.example):
- All routes (Home, Summary, Tech, Healthtech, Settings)
- All UI components
- All chart components
- All utilities and state management
- Build configuration (vite.config.ts, tsconfig.json)

**Note**: `backend.py` was moved to `backend/backend.py` with zero modifications.

---

## New Dependencies

### Python (requirements.txt)

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.6.0
google-generativeai==0.3.2
requests==2.31.0
pytest==7.4.4
httpx==0.26.0
```

Plus existing dependencies:
```
numpy==1.26.3
pandas==2.2.0
yfinance==0.2.35
finnhub-python==2.4.19
```

### JavaScript (package.json)

```
date-fns (added via npm install)
```

All other dependencies were already present.

---

## Feature Flag Files

Files that check or use the feature flag:

**Backend**:
- `backend/infra/secrets.py` - Reads `FEATURE_RISK_CHAT`
- `backend/routers/chat.py` - Checks flag, returns 404 if off
- `backend/routers/chat_confirm.py` - Checks flag, returns 404 if off
- `backend/app.py` - Returns flag status in root endpoint

**Frontend**:
- `frontend/src/App.tsx` - Checks `VITE_FEATURE_RISK_CHAT`
- `frontend/.env.example` - Documents flag

---

## Lines of Code (Approximate)

| Category | Files | Lines |
|----------|-------|-------|
| Backend Python | 22 | ~2,500 |
| Frontend TypeScript | 5 | ~600 |
| Documentation | 5 | ~2,000 |
| Tests | 1 | ~200 |
| **Total** | **33** | **~5,300** |

---

## Size Comparison

**Before Risk Chat**:
- Backend: 1 file (`backend.py`, ~150 lines)
- Frontend: Existing React app (~3,000 lines)

**After Risk Chat**:
- Backend: 22 files (~2,500 lines) + original `backend.py`
- Frontend: +5 files (~600 lines)

**Impact**:
- Code added: ~3,100 lines
- Files added: 33 files
- Files removed: 0 files
- Files modified: 2 files (App.tsx, .env.example)

---

## Build Artifacts

**Frontend** (`frontend/dist/`):
- Generated on `npm run build`
- Includes compiled JavaScript, CSS, assets
- Deployed to Vercel

**Backend** (No build step):
- Python runs directly
- No compilation needed

---

## Git Status Suggestion

After implementation, recommended commit structure:

```bash
# Commit 1: Backend infrastructure
git add backend/ requirements.txt .env.example
git commit -m "feat: add FastAPI backend with Gemini integration"

# Commit 2: Frontend components
git add frontend/src/components/RiskChat/ frontend/src/App.tsx
git commit -m "feat: add Risk Chat widget component"

# Commit 3: Documentation
git add docs/risk-chat/ RISK_CHAT_IMPLEMENTATION.md PROJECT_TREE.md
git commit -m "docs: add Risk Chat documentation"

# Commit 4: Build tools
git add Makefile
git commit -m "chore: add development scripts"
```

Or as a single commit:
```bash
git add .
git commit -m "feat: add Gemini-powered Risk Chat feature

- FastAPI backend with tool-calling
- React chat widget with confirmation dialogs
- RBAC with USER/RISK/ADMIN roles
- Operational runbooks for 4 scenarios
- Comprehensive audit logging
- Full documentation suite
- Feature flag for gradual rollout

Non-breaking: App works exactly as before when flag is off"
```

---

## Deployment Checklist

Before deploying:

- [ ] Set `GEMINI_API_KEY` in backend environment
- [ ] Set `FEATURE_RISK_CHAT=1` in backend
- [ ] Set `VITE_FEATURE_RISK_CHAT=true` in frontend
- [ ] Update `VITE_API_BASE_URL` to point to deployed backend
- [ ] Test with flag ON
- [ ] Test with flag OFF (verify no breaking changes)
- [ ] Run `pytest backend/tests/` (should pass)
- [ ] Run `cd frontend && npm run build` (should succeed)
- [ ] Review audit logs after deployment
- [ ] Monitor Gemini API usage/costs

---

## Summary

**Total Files Created**: 33 files
**Total Files Modified**: 2 files
**Total Files Removed**: 0 files
**Original Files Preserved**: 100%

**Non-Breaking Guarantee**: ✅ Verified
**Tests Passing**: ✅ All smoke tests pass
**Build Success**: ✅ Frontend builds without errors
**Documentation Complete**: ✅ 5 comprehensive docs

**Status**: Ready for deployment 🚀
