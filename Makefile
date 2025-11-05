# Makefile for FinTech Risk Operations

.PHONY: help install dev backend frontend test lint clean

help:
	@echo "FinTech Risk Operations - Available Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install all dependencies (frontend + backend)"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Run both frontend and backend concurrently"
	@echo "  make frontend         Run frontend dev server only"
	@echo "  make backend          Run backend API server only"
	@echo "  make risk-chat        Run with Risk Chat feature enabled"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all tests"
	@echo "  make test-backend     Run backend tests only"
	@echo "  make test-frontend    Run frontend tests only"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             Lint frontend code"
	@echo "  make format           Format frontend code"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            Remove build artifacts"

install:
	@echo "Installing backend dependencies..."
	pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✓ All dependencies installed"

backend:
	@echo "Starting backend server..."
	python -m backend.main

frontend:
	@echo "Starting frontend dev server..."
	cd frontend && npm run dev

risk-chat:
	@echo "Starting backend with Risk Chat enabled..."
	@FEATURE_RISK_CHAT=1 python -m backend.main &
	@echo "Starting frontend with Risk Chat enabled..."
	@cd frontend && VITE_FEATURE_RISK_CHAT=true npm run dev

test:
	@echo "Running backend tests..."
	pytest backend/tests/ -v
	@echo "Running frontend tests..."
	cd frontend && npm run test

test-backend:
	pytest backend/tests/ -v

test-frontend:
	cd frontend && npm run test

lint:
	cd frontend && npm run lint

format:
	cd frontend && npm run format

clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.vite
	rm -rf backend/__pycache__
	rm -rf backend/**/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} +
	@echo "✓ Cleaned"
