$ErrorActionPreference = "Stop"

Write-Host "== NexaLearn Preflight Check ==" -ForegroundColor Cyan

$root = "C:\Users\legra\NexaLearn"
if (!(Test-Path $root)) {
  throw "Project path not found: $root"
}

$required = @(
  "index.html",
  "styles.css",
  "app.js",
  ".env.example",
  "_headers",
  "wrangler.toml",
  "MANUAL_SETUP_GITHUB_CLOUDFLARE_SUPABASE.md",
  "supabase\config.toml",
  "supabase\migrations\20260427_001_init.sql",
  "supabase\migrations\20260427_002_storage_and_admin.sql",
  "cloudflare\pages-env.example.txt"
)

foreach ($item in $required) {
  $path = Join-Path $root $item
  if (!(Test-Path $path)) {
    throw "Missing required file: $item"
  }
}

Write-Host "All required setup files exist." -ForegroundColor Green

Write-Host ""
Write-Host "Git status:" -ForegroundColor Cyan
git -C $root status --short

Write-Host ""
Write-Host "Current remote:" -ForegroundColor Cyan
git -C $root remote -v

$remoteUrl = git -C $root remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0 -and $remoteUrl -match "<your-username>") {
  Write-Host ""
  Write-Host "Reminder: Replace placeholder GitHub remote URL." -ForegroundColor Yellow
} else {
  Write-Host ""
  Write-Host "Remote URL looks resolved." -ForegroundColor Green
}
