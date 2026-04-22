# Hotfix: Präsentation einchecken mit korrekten Pfaden nach Phase 2
$ErrorActionPreference = 'Stop'
Set-Location (git rev-parse --show-toplevel)

Write-Host "=== Staging praesentation_2026-04-16.html ===" -ForegroundColor Cyan
git add "docs/praesentation_2026-04-16.html"

Write-Host "=== Commit ===" -ForegroundColor Cyan
git commit -m "docs: Praesentation 2026-04-16 einchecken (Pfade auf level_2_shaft/level_3_sea angepasst)"

Write-Host ""
git log --oneline -5
