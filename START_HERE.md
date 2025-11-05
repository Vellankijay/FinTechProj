# 🚀 Quick Start Guide

## Prerequisites

- **Python 3.9+** installed
- **Node.js 18+** installed
- **Gemini API Key** (get from https://aistudio.google.com/app/apikey)

---

## 🔧 Installation

### 1. Install all dependencies

```bash
npm run install:all
```

This will install:
- Root dependencies (concurrently)
- Backend dependencies (FastAPI, Gemini, etc.)
- Frontend dependencies (React, Vite, etc.)

**Or install manually:**

```bash
# Root
npm install

# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## ⚙️ Configuration

### 1. Create `.env` file in project root:

```env
# Enable Risk Chat Feature
FEATURE_RISK_CHAT=1

# Gemini API Key (REQUIRED for Risk Chat)
GEMINI_API_KEY=your_api_key_here

# Service Endpoints (mock for demo)
RISK_API_BASE=https://risk-api.local
OMS_BASE=https://oms.local
ALERT_TOPIC=alerts.events

# ClickHouse (optional)
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

### 2. Create `frontend/.env.local`:

```env
# Enable Risk Chat in Frontend
VITE_FEATURE_RISK_CHAT=true

# Backend API URL
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🎯 Running the Application

### Option 1: Run Both Together (Recommended)

```bash
npm run dev
```

This starts:
- ✅ **Backend** on http://localhost:8000 (FastAPI)
- ✅ **Frontend** on http://localhost:5173 (Vite)

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run backend
# OR
python -m backend.main
```

**Terminal 2 - Frontend:**
```bash
npm run frontend
# OR
cd frontend && npm run dev
```

---

## 🧪 Testing

### Run Backend Tests
```bash
npm run test
# OR
pytest backend/tests/ -v
```

### Run Frontend Tests
```bash
npm run test:frontend
# OR
cd frontend && npm run test
```

---

## 📱 Using the App

### Without Risk Chat (Default)
1. Visit http://localhost:5173
2. Use the dashboard as normal
3. No chat button appears

### With Risk Chat (Feature Enabled)
1. Make sure `.env` has `FEATURE_RISK_CHAT=1`
2. Make sure `frontend/.env.local` has `VITE_FEATURE_RISK_CHAT=true`
3. Restart both servers
4. Visit http://localhost:5173
5. Click the **green chat button** in bottom-right corner

### Try These Queries
- `"What's PM_BOOK1 VaR trend last 30 min?"`
- `"Why did we trip VAR_BREACH at 10:32?"`
- `"Playbook for order-flow anomaly"`
- `"Run stress test on PM_BOOK1 with -10% shock"`
- `"Halt trading AAPL for SELL-DESK-2 due to unusual order flow"` (requires confirmation)

---

## 📂 Project Structure

```
FinTechProj/
├── backend/              # FastAPI backend
│   ├── app.py           # Main app
│   ├── main.py          # Server entry
│   ├── routers/         # API endpoints
│   ├── services/        # Business logic
│   ├── tools/           # Tool wrappers
│   └── tests/           # Tests
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── RiskChat/  # Chat widget
│   │   └── routes/      # Pages
│   └── package.json
│
├── docs/                # Documentation
│   └── risk-chat/
│
├── package.json         # Root scripts
├── requirements.txt     # Python dependencies
└── .env.example         # Environment template
```

---

## 🎨 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run frontend + backend together |
| `npm run backend` | Run backend only |
| `npm run frontend` | Run frontend only |
| `npm run install:all` | Install all dependencies |
| `npm run build` | Build frontend for production |
| `npm run test` | Run backend tests |
| `npm run test:frontend` | Run frontend tests |

---

## 🔍 Troubleshooting

### "Risk chat feature is not enabled"
- Check `.env` has `FEATURE_RISK_CHAT=1`
- Restart backend server

### Chat button doesn't appear
- Check `frontend/.env.local` has `VITE_FEATURE_RISK_CHAT=true`
- Restart frontend dev server

### Backend won't start
- Make sure Python packages are installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.9+)

### Frontend won't start
- Make sure frontend dependencies are installed: `cd frontend && npm install`
- Check Node version: `node --version` (should be 18+)

### Port already in use
- Backend uses port 8000
- Frontend uses port 5173
- Kill existing processes or change ports in code

---

## 📚 Documentation

- **Quick Start**: This file
- **Feature Overview**: `/docs/risk-chat/README.md`
- **Architecture**: `/docs/risk-chat/ARCHITECTURE.md`
- **Security**: `/docs/risk-chat/SECURITY.md`
- **Tech Stack**: `/docs/risk-chat/STACK_NOTES.md`

---

## 🤝 Getting Help

1. Check documentation in `/docs/risk-chat/`
2. Review example code in `/backend/tests/`
3. Open an issue on GitHub

---

## ✅ Verification Checklist

Before running, make sure:

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] `pip install -r requirements.txt` completed
- [ ] `npm run install:all` completed
- [ ] `.env` file created with `GEMINI_API_KEY`
- [ ] `frontend/.env.local` created
- [ ] Ports 8000 and 5173 are available

---

**Ready to go!** Run `npm run dev` and visit http://localhost:5173 🎉
