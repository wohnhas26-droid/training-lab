# Production Docker deploy (run from project root)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Test-Path ".env")) {
  Write-Host "Missing .env — copy .env.example and fill in production values." -ForegroundColor Red
  exit 1
}

$required = @(
  "JWT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_PLAYER",
  "STRIPE_PRICE_ELITE",
  "STRIPE_PRICE_TEAM"
)
$envContent = Get-Content ".env" -Raw
foreach ($key in $required) {
  if ($envContent -notmatch "$key=`"[^.`"]") {
    Write-Host "Warning: $key may not be set in .env" -ForegroundColor Yellow
  }
}

if ($envContent -match 'JWT_SECRET="change-me') {
  Write-Host "Warning: Set a strong JWT_SECRET before production." -ForegroundColor Yellow
}

Write-Host "Building and starting containers..." -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml up -d --build

Write-Host ""
Write-Host "Frontend: http://localhost (port 80)"
Write-Host "API health: http://localhost/api/health"
Write-Host ""
Write-Host "First deploy — seed demo data:"
Write-Host "  docker compose -f docker-compose.prod.yml exec api node prisma/seed.js"
Write-Host ""
Write-Host "Register production webhook after domain is live:"
Write-Host "  npm run stripe:webhooks -- https://yourdomain.com"
