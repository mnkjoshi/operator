# Operator Setup Script for Windows PowerShell

Write-Host "Setting up Operator (Gemini-only)..." -ForegroundColor Cyan

# Check Node.js
Write-Host "`nChecking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js $nodeVersion found" -ForegroundColor Green

# Check Python
Write-Host "`nChecking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python not found. Please install Python 3.9+ from https://www.python.org/" -ForegroundColor Yellow
    Write-Host "Backend will need to be set up manually" -ForegroundColor Yellow
} else {
    Write-Host "$pythonVersion found" -ForegroundColor Green
}

# Frontend Setup
Write-Host "`nSetting up Frontend..." -ForegroundColor Cyan
Set-Location frontend

if (Test-Path "node_modules") {
    Write-Host "Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
}

Set-Location ..

# Backend Setup
Write-Host "`nSetting up Backend..." -ForegroundColor Cyan
Set-Location backend

if ($pythonVersion) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "Some backend dependencies may have failed" -ForegroundColor Yellow
    }

    Write-Host "Installing Playwright Chromium..." -ForegroundColor Yellow
    python -m playwright install chromium

    if (!(Test-Path ".env")) {
        Write-Host "Creating .env file..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "Please edit backend/.env and set:" -ForegroundColor Yellow
        Write-Host " - GEMINI_API_KEY" -ForegroundColor White
    } else {
        Write-Host ".env file exists" -ForegroundColor Green
    }
}

Set-Location ..

Write-Host "`nSetup Complete" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set GEMINI_API_KEY in backend/.env" -ForegroundColor White
Write-Host "2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Start backend:  cd backend && python main.py" -ForegroundColor White
