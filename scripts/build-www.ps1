# Copy web assets into www/ for Capacitor
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$www = Join-Path $root "www"
if (Test-Path $www) { Remove-Item $www -Recurse -Force }
New-Item -ItemType Directory -Path $www | Out-Null

$copyItems = @(
  "index.html", "login.html", "onboarding.html", "pricing.html",
  "css", "js", "player", "coach", "parent", "subscription"
)
foreach ($item in $copyItems) {
  $src = Join-Path $root $item
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $www $item) -Recurse -Force
  }
}

Write-Host "www/ ready for Capacitor sync." -ForegroundColor Green
