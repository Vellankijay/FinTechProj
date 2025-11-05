"""
Main entry point for running the backend server.

Usage:
    python -m backend.main
    OR
    uvicorn backend.main:app --reload
"""
import uvicorn
from .app import app

if __name__ == "__main__":
    uvicorn.run(
        "backend.app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
