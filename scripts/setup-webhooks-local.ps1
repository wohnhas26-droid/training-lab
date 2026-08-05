# Forward Stripe webhooks to local API and update .env
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Find-StripeCli {
  $cmd = Get-Command stripe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $paths = @(
    "$env:LOCALAPPDATA\stripe\stripe.exe",
    "C:\Program Files\Stripe\stripe.exe"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) { return $p }
  }
  return $null
}

$stripe = Find-StripeCli
if (-not $stripe) {
  Write-Host "Stripe CLI is not installed." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Install:"
  Write-Host "  winget install --id Stripe.StripeCli -e"
  Write-Host "  stripe login"
  Write-Host ""
  Write-Host "Or download: https://stripe.com/docs/stripe-cli#install"
  Write-Host ""
  Write-Host "Manual alternative — add endpoint in Stripe Dashboard (test mode):"
  Write-Host "  URL: use stripe listen output, or ngrok tunnel to localhost:3001/api/webhooks/stripe"
  Write-Host "  Events: checkout.session.completed, customer.subscription.*, invoice.paid, invoice.payment_failed"
  exit 1
}

Write-Host "Starting Stripe webhook forwarder..." -ForegroundColor Cyan
Write-Host "  Forward to: http://localhost:3001/api/webhooks/stripe"
Write-Host ""
Write-Host "When you see 'whsec_...', add to .env and backend/.env:"
Write-Host '  STRIPE_WEBHOOK_SECRET="whsec_..."'
Write-Host ""
Write-Host "Keep this window open while testing checkout. Press Ctrl+C to stop."
Write-Host ""

& $stripe listen --forward-to localhost:3001/api/webhooks/stripe
