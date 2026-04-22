#!/usr/bin/env bash
# Cleanup commit helper — run this from the repo root
# Branch: chore/project-cleanup-2026-04-21
# Created by agent, 2026-04-21

set -e
cd "$(git rev-parse --show-toplevel)"

echo "=== Phase 1 commit ==="
git add "PixelArt/_archive/README.md" "PixelArt/README.md"
git commit -m "cleanup(phase1): Archive-Infrastruktur + PixelArt-README anlegen"
echo "Phase 1 done."

echo ""
echo "=== Phase 4 commit ==="
git add "PixelArt/fonts/"
git add "src/dialogue.js"
git commit -m "cleanup(phase4): Fonts archivieren — Vecteezy-Quelldateien in Archive/, aktive PNGs aktualisiert"
echo "Phase 4 done."

echo ""
echo "=== Final log ==="
git log --oneline -5
