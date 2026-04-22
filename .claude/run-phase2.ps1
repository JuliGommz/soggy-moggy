# Phase 2: Level-Ordner umbenennen (L2/L3 Swap)
# Run from repo root in PowerShell

$ErrorActionPreference = 'Stop'
Set-Location (git rev-parse --show-toplevel)

Write-Host "=== Phase 2: git mv Level folders ===" -ForegroundColor Cyan

git mv "PixelArt/backgrounds/level2_see" "PixelArt/backgrounds/level_3_sea"
Write-Host "  level2_see -> level_3_sea" -ForegroundColor Green

git mv "PixelArt/backgrounds/level3_shaft" "PixelArt/backgrounds/level_2_shaft"
Write-Host "  level3_shaft -> level_2_shaft" -ForegroundColor Green

git mv "PixelArt/platforms/level2_lift" "PixelArt/platforms/level_2_lift"
Write-Host "  level2_lift -> level_2_lift" -ForegroundColor Green

Write-Host ""
Write-Host "=== Staging src edits ===" -ForegroundColor Cyan
git add "src/background.js" "src/platforms.js"

Write-Host ""
Write-Host "=== Phase 2 commit ===" -ForegroundColor Cyan
git commit -m "cleanup(phase2): Level-Ordner umbenennen - level_2_shaft/, level_3_sea/, level_2_lift/; src-Pfade angepasst"
Write-Host "Phase 2 done." -ForegroundColor Green

Write-Host ""
Write-Host "=== git log --oneline -5 ===" -ForegroundColor Cyan
git log --oneline -5
