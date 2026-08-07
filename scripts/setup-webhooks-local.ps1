# Forward Stripe webhooks locally and save STRIPE_WEBHOOK_SECRET to .env files
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Find-StripeCli {
  $cmd = Get-Command stripe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $winget = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "stripe.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($winget) { return $winget.FullName }
  return $null
}

function Get-EnvValue($file, $key) {
  if (-not (Test-Path $file)) { return $null }
  $line = Select-String -Path $file -Pattern "^$key=`"(.*)`"$" | Select-Object -First 1
  if ($line) { return $line.Matches.Groups[1].Value }
  return $null
}

function Set-EnvValue($file, $key, $value) {
  $content = Get-Content $file -Raw
  if ($content -match "(?m)^$key=`"") {
    $content = $content -replace "(?m)^$key=`"[^`"]*`"", "$key=`"$value`""
  } else {
    $content = $content.TrimEnd() + "`n$key=`"$value`"`n"
  }
  Set-Content -Path $file -Value $content -NoNewline
}

$stripe = Find-StripeCli
if (-not $stripe) {
  Write-Host "Stripe CLI not found. Install with:" -ForegroundColor Yellow
  Write-Host "  winget install --id Stripe.StripeCli -e"
  exit 1
}

$apiKey = Get-EnvValue ".env" "STRIPE_SECRET_KEY"
if (-not $apiKey -or -not $apiKey.StartsWith("sk_")) {
  Write-Host "Set STRIPE_SECRET_KEY in .env first." -ForegroundColor Red
  exit 1
}

$forwardUrl = "localhost:3001/api/webhooks/stripe"
Write-Host "Stripe CLI: $stripe" -ForegroundColor Cyan
Write-Host "Forwarding to: http://$forwardUrl"
Write-Host ""

$existingSecret = Get-EnvValue ".env" "STRIPE_WEBHOOK_SECRET"
if (-not $existingSecret -or -not $existingSecret.StartsWith("whsec_")) {
  Write-Host "Fetching webhook signing secret..." -ForegroundColor Gray
  $secretOutput = & $stripe listen --api-key $apiKey --forward-to $forwardUrl --print-secret 2>&1
  $secret = ($secretOutput | Select-String -Pattern 'whsec_[A-Za-z0-9]+' | Select-Object -First 1).Matches.Value
  if ($secret) {
    Set-EnvValue ".env" "STRIPE_WEBHOOK_SECRET" $secret
    Set-EnvValue "backend\.env" "STRIPE_WEBHOOK_SECRET" $secret
    Write-Host "Saved STRIPE_WEBHOOK_SECRET to .env and backend/.env" -ForegroundColor Green
  } else {
    Write-Host "Could not get webhook secret. Try: stripe login" -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "Using existing STRIPE_WEBHOOK_SECRET from .env" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Restart the API if it is already running: npm run dev" -ForegroundColor Yellow
Write-Host "Keep this window open while testing checkout. Press Ctrl+C to stop."
Write-Host ""

& $stripe listen --api-key $apiKey --forward-to $forwardUrl
