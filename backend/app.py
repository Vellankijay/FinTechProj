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
from .routers import server, health  # This imports your tech portfolio router
from .infra.secrets import get_config

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
# print(env_path)
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
        "http://127.0.0.1:5173",  # Explicit 127.0.0.1
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount chat routers
app.include_router(chat.router, tags=["Chat"])
app.include_router(chat_confirm.router, tags=["Chat"])

# Mount tech portfolio risk router - THIS IS THE KEY LINE
app.include_router(server.router, tags=["Risk_Tech"])
app.include_router(health.router, tags=["Risk_Health"])
print("✅ Tech Portfolio Router mounted at /api/tech/portfolio")

@app.get("/")
async def root():
    """Root endpoint."""
    config = get_config()
    return {
        "service": "FinTech Risk Operations API",
        "version": "1.0.0",
        "features": {
            "risk_chat": config["FEATURE_RISK_CHAT"]
        },
        "endpoints": {
            "root": "/",
            "health": "/health",
            "docs": "/docs",
            "tech_portfolio": "/api/tech/portfolio"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "FinTech Risk Operations API",
        "port": 8000
    }

# Add startup event to confirm server is running
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("🚀 FinTech Risk Operations API Starting")
    print("="*60)
    print("📍 Server running on port 8000")
    print("🔗 Available endpoints:")
    print("   • Root:             http://localhost:8000/")
    print("   • Health:           http://localhost:8000/health")
    print("   • Tech Portfolio:   http://localhost:8000/api/tech/portfolio")
    print("   • Health Portfolio:   http://localhost:8000/api/health/portfolio")
    print("   • API Docs:         http://localhost:8000/docs")
    print("="*60 + "\n")
