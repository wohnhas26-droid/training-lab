# Initialize git repo and create first commit for Futbol Training Lab
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Find-Git {
  $cmd = Get-Command git -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $paths = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files\Git\bin\git.exe"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) { return $p }
  }
  return $null
}

$git = Find-Git
if (-not $git) {
  Write-Host "Git is not installed." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Install with winget (recommended):"
  Write-Host "  winget install --id Git.Git -e"
  Write-Host ""
  Write-Host "Then re-run:"
  Write-Host "  powershell -File scripts/setup-git.ps1"
  exit 1
}

Write-Host "Using git: $git" -ForegroundColor Cyan

$name = & $git config user.name 2>$null
$email = & $git config user.email 2>$null
if (-not $name -or -not $email) {
  $globalName = & $git config --global user.name 2>$null
  $globalEmail = & $git config --global user.email 2>$null
  if (-not $globalName -or -not $globalEmail) {
    Write-Host "Git identity not configured. Set it once:" -ForegroundColor Yellow
    Write-Host '  git config --global user.name "Ryan"'
    Write-Host '  git config --global user.email "you@example.com"'
    Write-Host ""
    Write-Host "Using local repo identity for this commit only."
    if (-not $name) { & $git config user.name "Ryan" }
    if (-not $email) { & $git config user.email "ryan@local" }
  }
}

if (-not (Test-Path ".git")) {
  & $git init
  & $git branch -M main
} else {
  Write-Host "Git repo already initialized." -ForegroundColor Gray
}

& $git add -A
$status = & $git status --porcelain
if (-not $status) {
  Write-Host "Nothing to commit - working tree clean." -ForegroundColor Green
} else {
  $msg = "Initial commit: Futbol Training Lab - subscription platform with Stripe, dashboards, Docker deploy, and webhooks."
  & $git commit -m $msg
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed. Configure identity and re-run:" -ForegroundColor Red
    Write-Host '  git config --global user.name "Ryan"'
    Write-Host '  git config --global user.email "you@example.com"'
    Write-Host "  npm run setup:git"
    exit 1
  }
  Write-Host "Initial commit created." -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps (GitHub):" -ForegroundColor Cyan
Write-Host "  1. Create a repo at https://github.com/new"
Write-Host "  2. git remote add origin https://github.com/YOUR_USER/training-lab.git"
Write-Host "  3. git push -u origin main"
Write-Host ""
Write-Host "See docs/DEPLOY.md for Railway/Render deploy from GitHub."
