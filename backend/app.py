"""
FastAPI application entry point.

Mounts existing backend.py functionality and new chat routes.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import chat, chat_confirm
from .infra.secrets import get_config

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Create FastAPI app
app = FastAPI(
    title="FinTech Risk Operations API",
    description="Risk analytics and AI-powered risk operations assistant",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (alternate port)
        "http://localhost:3000",  # Alternative dev port
        "http://localhost:8000",  # Backend dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount chat routers
app.include_router(chat.router, tags=["Chat"])
app.include_router(chat_confirm.router, tags=["Chat"])


@app.get("/")
async def root():
    """Root endpoint."""
    config = get_config()
    return {
        "service": "FinTech Risk Operations API",
        "version": "1.0.0",
        "features": {
            "risk_chat": config["FEATURE_RISK_CHAT"]
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# Optional: If you want to expose backend.py functionality as API endpoints
# You can import and wrap functions from backend.backend here
# For example:
#
# from .backend import compute_risk
#
# @app.post("/api/risk/compute")
# async def compute_risk_endpoint(symbol: str = None, industry: str = None):
#     try:
#         risk_score = compute_risk(symbol=symbol, industry=industry)
#         return {"risk_score": risk_score}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
