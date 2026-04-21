# Phase 5 — dialogue-system rewrite (static PNG bubbles, no font atlas)
# Part of docs/plans/2026-04-21-project-cleanup.md
#
# What this script does:
#   1. git rm src/font.js (orphan after dialogue.js rewrite, no remaining callers)
#   2. git mv thought-bubbles.{png,pxo} -> PixelArt/_archive/thought_bubbles_v1/
#   3. Create PixelArt/thought_bubbles/dialogues/ folder with .gitkeep
#   4. git add dialogue.js rewrite + index.html + game-state.js comment fix
#   5. Atomic commit

$ErrorActionPreference = 'Stop'
Set-Location (git rev-parse --show-toplevel)

Write-Host "==> Phase 5: dialogue-rewrite + archive old bubble sheet ---------" -ForegroundColor Cyan

# --- 1. Remove orphan font.js ----------------------------------------------
Write-Host "  rm src/font.js (orphan)" -ForegroundColor DarkGray
git rm "src/font.js"

# --- 2. Archive old bubble sheet -------------------------------------------
Write-Host "  mkdir PixelArt/_archive/thought_bubbles_v1/" -ForegroundColor DarkGray
New-Item -ItemType Directory -Force -Path "PixelArt/_archive/thought_bubbles_v1" | Out-Null

Write-Host "  mv thought-bubbles.png -> _archive/thought_bubbles_v1/" -ForegroundColor DarkGray
git mv "PixelArt/thought_bubbles/thought-bubbles.png" "PixelArt/_archive/thought_bubbles_v1/thought-bubbles.png"

Write-Host "  mv thought-bubbles.pxo -> _archive/thought_bubbles_v1/" -ForegroundColor DarkGray
git mv "PixelArt/thought_bubbles/thought-bubbles.pxo" "PixelArt/_archive/thought_bubbles_v1/thought-bubbles.pxo"

# --- 3. Create dialogues/ folder for incoming Illustrator exports ----------
Write-Host "  mkdir PixelArt/thought_bubbles/dialogues/ (.gitkeep)" -ForegroundColor DarkGray
New-Item -ItemType Directory -Force -Path "PixelArt/thought_bubbles/dialogues" | Out-Null
Set-Content -Path "PixelArt/thought_bubbles/dialogues/.gitkeep" -Value "# Placeholder; replaced by 8 bubble PNGs from Illustrator export."
git add "PixelArt/thought_bubbles/dialogues/.gitkeep"

# --- 4. Stage code + supporting edits --------------------------------------
Write-Host "==> staging rewrite + index.html + game-state comment" -ForegroundColor Cyan
git add src/dialogue.js
git add index.html
git add src/game-state.js
git add .claude/run-phase5.ps1

# --- 5. Commit --------------------------------------------------------------
Write-Host "==> committing" -ForegroundColor Cyan
git commit -m "cleanup(phase5): dialogue system rewrite - static bubble PNGs, no font atlas" `
           -m "Removes all automatic text generation:" `
           -m "- dialogue.js: loads 8 individual PNGs from thought_bubbles/dialogues/," `
           -m "  shows magenta-dashed placeholder when a PNG is missing." `
           -m "- src/font.js deleted (orphan after removal of drawText/normalizeText)." `
           -m "- index.html: font.js script tag removed." `
           -m "- Old thought-bubbles.{png,pxo} archived to _archive/thought_bubbles_v1/." `
           -m "- dialogues/ folder reserved for incoming Illustrator PNG exports."

# --- 6. Recent history ------------------------------------------------------
Write-Host "==> recent history" -ForegroundColor Cyan
git log --oneline -6

Write-Host "==> Phase 5 done. Smoke-test index.html in browser (placeholders expected)." -ForegroundColor Green
