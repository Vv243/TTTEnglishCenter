Write-Host "🚀 TTTEnglishCenter Setup Script (Windows)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host ""
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Download: https://www.docker.com/products/docker-desktop/"
    exit 1
}
Write-Host "✅ Docker found" -ForegroundColor Green

if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python 3.11+." -ForegroundColor Red
    Write-Host "   Download: https://www.python.org/downloads/"
    exit 1
}
Write-Host "✅ Python found: $(python --version)" -ForegroundColor Green

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+." -ForegroundColor Red
    Write-Host "   Download: https://nodejs.org/"
    exit 1
}
Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green

# Start Docker services
Write-Host ""
Write-Host "🐳 Starting Docker services..." -ForegroundColor Yellow
docker compose up -d
Write-Host "✅ Docker services started" -ForegroundColor Green

# Backend setup
Write-Host ""
Write-Host "🔧 Setting up backend..." -ForegroundColor Yellow
Set-Location backend

if (!(Test-Path "venv")) {
    Write-Host "   Creating Python virtual environment..."
    python -m venv venv
}

Write-Host "   Installing Python dependencies..."
.\venv\Scripts\activate
pip install -q -r requirements.txt

if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created backend/.env" -ForegroundColor Green
} else {
    Write-Host "✅ backend/.env already exists" -ForegroundColor Green
}

Set-Location ..

# Frontend setup
Write-Host ""
Write-Host "⚛️  Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend

Write-Host "   Installing Node dependencies..."
npm install --silent

if (!(Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ Created frontend/.env.local" -ForegroundColor Green
} else {
    Write-Host "✅ frontend/.env.local already exists" -ForegroundColor Green
}

Set-Location ..

# Done
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:"
Write-Host ""
Write-Host "  Backend (new terminal):" -ForegroundColor Yellow
Write-Host "    cd backend"
Write-Host "    .\venv\Scripts\activate"
Write-Host "    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
Write-Host ""
Write-Host "  Frontend (new terminal):" -ForegroundColor Yellow
Write-Host "    cd frontend"
Write-Host "    npm run dev"
Write-Host ""
Write-Host "  Then open: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  pgAdmin:   http://localhost:5050" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan