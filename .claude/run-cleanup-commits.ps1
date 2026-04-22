# Cleanup commit helper — run from repo root in PowerShell
# Branch: chore/project-cleanup-2026-04-21

$ErrorActionPreference = 'Stop'

Set-Location (git rev-parse --show-toplevel)

Write-Host "=== Phase 1 commit ===" -ForegroundColor Cyan
git add "PixelArt/_archive/README.md" "PixelArt/README.md"
git commit -m "cleanup(phase1): Archive-Infrastruktur + PixelArt-README anlegen"
Write-Host "Phase 1 done." -ForegroundColor Green

Write-Host ""
Write-Host "=== Phase 4 commit ===" -ForegroundColor Cyan
git add "PixelArt/fonts/"
git add "src/dialogue.js"
git commit -m "cleanup(phase4): Fonts archivieren - Vecteezy-Quelldateien in Archive/, aktive PNGs aktualisiert"
Write-Host "Phase 4 done." -ForegroundColor Green

Write-Host ""
Write-Host "=== Final log ===" -ForegroundColor Cyan
git log --oneline -5
