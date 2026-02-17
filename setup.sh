#!/bin/bash

set -e

echo "🚀 TTTEnglishCenter Setup Script (Mac/Linux)"
echo "============================================"

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop first."
    echo "   Download: https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo "✅ Docker found"

if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.11+."
    echo "   Download: https://www.python.org/downloads/"
    exit 1
fi
echo "✅ Python3 found: $(python3 --version)"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+."
    echo "   Download: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Start Docker services
echo ""
echo "🐳 Starting Docker services (PostgreSQL, Redis, pgAdmin)..."
docker compose up -d
echo "✅ Docker services started"

# Backend setup
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "   Activating virtual environment..."
source venv/bin/activate

echo "   Installing Python dependencies..."
pip install -q -r requirements.txt

if [ ! -f ".env" ]; then
    echo "   Creating .env from template..."
    cp .env.example .env
    echo "✅ Created backend/.env"
else
    echo "✅ backend/.env already exists"
fi

cd ..

# Frontend setup
echo ""
echo "⚛️  Setting up frontend..."
cd frontend

echo "   Installing Node dependencies..."
npm install --silent

if [ ! -f ".env.local" ]; then
    echo "   Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created frontend/.env.local"
else
    echo "✅ frontend/.env.local already exists"
fi

cd ..

# Done
echo ""
echo "============================================"
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "  Backend (new terminal):"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "  Frontend (new terminal):"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo "  API docs:  http://localhost:8000/docs"
echo "  pgAdmin:   http://localhost:5050"
echo "============================================"