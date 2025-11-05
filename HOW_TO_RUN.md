# 🚀 How to Run Both Frontend and Backend Together

## Three Simple Ways to Get Started

---

## ⚡ Method 1: NPM Script (Easiest)

```bash
npm run dev
```

This single command starts:
- ✅ **Backend** (FastAPI) on port 8000
- ✅ **Frontend** (Vite) on port 5173

Both run in the same terminal with colored output!

---

## 🖱️ Method 2: Double-Click Scripts

### Windows
Double-click `run.bat`

### Mac/Linux
Double-click `run.sh` (or run `./run.sh` in terminal)

---

## 🔧 Method 3: Manual Terminals

**Terminal 1 - Backend:**
```bash
npm run backend
```

**Terminal 2 - Frontend:**
```bash
npm run frontend
```

---

## 📝 Complete Setup (First Time Only)

### 1. Install Dependencies

```bash
npm run install:all
```

This installs:
- Root packages (concurrently)
- Python packages (FastAPI, Gemini, etc.)
- Frontend packages (React, Vite, etc.)

### 2. Create Environment Files

**Create `.env` in project root:**
```env
FEATURE_RISK_CHAT=1
GEMINI_API_KEY=your_api_key_here
RISK_API_BASE=https://risk-api.local
OMS_BASE=https://oms.local
```

**Create `frontend/.env.local`:**
```env
VITE_FEATURE_RISK_CHAT=true
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run the App

```bash
npm run dev
```

### 4. Open Your Browser

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🎯 What You'll See

When you run `npm run dev`, you'll see:

```
[backend]  INFO:     Uvicorn running on http://0.0.0.0:8000
[backend]  INFO:     Application startup complete.
[frontend]
[frontend]   VITE v5.4.20  ready in 1234 ms
[frontend]
[frontend]   ➜  Local:   http://localhost:5173/
[frontend]   ➜  Network: use --host to expose
```

---

## 🧪 Testing the Risk Chat

1. Open http://localhost:5173
2. Click the **green chat button** in bottom-right corner
3. Try a query:
   ```
   What's PM_BOOK1 VaR trend last 30 min?
   ```

---

## 🛑 Stopping the Servers

Press `Ctrl+C` in the terminal (stops both frontend and backend)

---

## 🔍 Troubleshooting

### Port Already in Use

**Error**: `Address already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Backend Won't Start

**Error**: `ModuleNotFoundError`

**Solution**:
```bash
pip install -r requirements.txt
```

### Frontend Won't Start

**Error**: `Cannot find module`

**Solution**:
```bash
cd frontend
npm install
```

### Chat Button Not Appearing

**Solution**:
1. Check `frontend/.env.local` has `VITE_FEATURE_RISK_CHAT=true`
2. Restart frontend: `Ctrl+C` then `npm run dev`

---

## 📊 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both frontend + backend |
| `npm run backend` | Run backend only |
| `npm run frontend` | Run frontend only |
| `npm run install:all` | Install all dependencies |
| `npm run build` | Build frontend |
| `npm run test` | Run backend tests |
| `npm run test:frontend` | Run frontend tests |

---

## 🎨 Development Workflow

1. **Start servers**: `npm run dev`
2. **Make changes** to code
3. **Auto-reload**: Both servers auto-reload on file changes
4. **Test**: Backend at http://localhost:8000, Frontend at http://localhost:5173
5. **Stop**: `Ctrl+C`

---

## 📚 Next Steps

- **Full Setup Guide**: [START_HERE.md](./START_HERE.md)
- **Architecture Docs**: [docs/risk-chat/ARCHITECTURE.md](./docs/risk-chat/ARCHITECTURE.md)
- **Security Info**: [docs/risk-chat/SECURITY.md](./docs/risk-chat/SECURITY.md)

---

**That's it!** You're ready to develop with both frontend and backend running together 🎉
