# Run this once after installing Node.js
Write-Host "Setting up Futbol Training Lab..." -ForegroundColor Green

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host "Installing root dependencies..."
npm install

Write-Host "Installing backend dependencies..."
Push-Location backend
npm install

if (-not (Test-Path "../.env")) {
    Copy-Item "../.env.example" "../.env"
    Write-Host "Created .env from template — edit JWT_SECRET before production" -ForegroundColor Yellow
}

Write-Host "Setting up database..."
npm run setup

Pop-Location

Write-Host ""
Write-Host "Setup complete! Run 'npm run dev' to start." -ForegroundColor Green
Write-Host "  Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  API:      http://localhost:3001" -ForegroundColor Cyan
