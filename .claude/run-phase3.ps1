# Phase 3 — Asset-Gruppen characters/ und ui/ anlegen
# Part of docs/plans/2026-04-21-project-cleanup.md
# Detailed plan: docs/plans/2026-04-21-phase3-asset-groups.md
#
# Preconditions (done BEFORE running this script, via Edit tool):
#   - src/player.js, src/enemies.js, src/main.js paths updated.
#   - PixelArt/NAMING.md, PixelArt/README.md, docs/ASSET_LIST.md,
#     docs/praesentation_2026-04-16.html updated.
#
# What this script does:
#   1. git mv of cat/, enemy_wasp/, collectibles/life_* into new structure
#   2. git add modified source + doc files
#   3. Single atomic commit
#   4. Print recent history

$ErrorActionPreference = 'Stop'
Set-Location (git rev-parse --show-toplevel)

Write-Host "==> Phase 3: characters/ + ui/ -----------------------------------" -ForegroundColor Cyan

# --- 1. Asset moves ---------------------------------------------------------

Write-Host "  moving PixelArt/cat/ -> PixelArt/characters/cat/" -ForegroundColor DarkGray
New-Item -ItemType Directory -Force -Path "PixelArt/characters" | Out-Null
git mv "PixelArt/cat" "PixelArt/characters/cat"

Write-Host "  moving PixelArt/enemy_wasp/ -> PixelArt/characters/wasp/" -ForegroundColor DarkGray
git mv "PixelArt/enemy_wasp" "PixelArt/characters/wasp"

Write-Host "  moving collectibles/life_icon.* + life_plush.* -> ui/hud/" -ForegroundColor DarkGray
New-Item -ItemType Directory -Force -Path "PixelArt/ui/hud" | Out-Null
git mv "PixelArt/collectibles/life_icon.png"  "PixelArt/ui/hud/life_icon.png"
git mv "PixelArt/collectibles/life_icon.pxo"  "PixelArt/ui/hud/life_icon.pxo"
git mv "PixelArt/collectibles/life_plush.png" "PixelArt/ui/hud/life_plush.png"
git mv "PixelArt/collectibles/life_plush.pxo" "PixelArt/ui/hud/life_plush.pxo"

# --- 2. Stage code + doc edits ---------------------------------------------

Write-Host "==> staging code + doc edits" -ForegroundColor Cyan
git add src/player.js src/enemies.js src/main.js
git add PixelArt/NAMING.md PixelArt/README.md
git add docs/ASSET_LIST.md
git add docs/praesentation_2026-04-16.html
git add docs/plans/2026-04-21-phase3-asset-groups.md
git add .claude/run-phase3.ps1

# --- 3. Commit --------------------------------------------------------------

Write-Host "==> committing" -ForegroundColor Cyan
git commit -m "cleanup(phase3): Asset-Gruppen characters/ und ui/ anlegen" `
           -m "Reorganises PixelArt/ root: cat and wasp sprites move into" `
           -m "PixelArt/characters/, HUD life icons move into PixelArt/ui/hud/." `
           -m "collectibles/ now only contains balloon (in-game pickup)." `
           -m "Updates all src/*.js path strings and active documentation" `
           -m "(NAMING.md, README.md, ASSET_LIST.md, praesentation 2026-04-16)." `
           -m "See docs/plans/2026-04-21-phase3-asset-groups.md for mapping decisions."

# --- 4. Recent history ------------------------------------------------------

Write-Host "==> recent history" -ForegroundColor Cyan
git log --oneline -5

Write-Host "==> Phase 3 done. Smoke-test index.html in browser." -ForegroundColor Green
