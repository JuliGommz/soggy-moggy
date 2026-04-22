# Phase 7 — pipes_bottom Feature-Fix
# Part of docs/plans/2026-04-21-project-cleanup.md
#
# What this script does:
#   1. Commit the _drawL3Mid rewrite that now also draws pipes_bottom
#      (bottom edge anchored at elevator ceiling, world-y 96).

$ErrorActionPreference = 'Stop'
Set-Location (git rev-parse --show-toplevel)

Write-Host "==> Phase 7: pipes_bottom in L3Mid einbinden --------------------" -ForegroundColor Cyan

git add src/background.js
git add .claude/run-phase7.ps1

git commit -m "cleanup(phase7): pipes_bottom in _drawL3Mid einbinden" `
           -m "pipes_bottom.png war geladen aber ungezeichnet. Neu:" `
           -m "- pipes_bottom.png tile bottom anchored at world-y 96 (elevator ceiling)." `
           -m "- pipes_mid stack starts one tile-height higher (96 - 2 * BG_H)." `
           -m "- pipes_top cap unchanged (content-top at levelGoalY)." `
           -m "- comment block rewritten to describe new 3-stage stack."

Write-Host ""
git log --oneline -6
Write-Host "==> Phase 7 done. Smoke-test L2 shaft transition." -ForegroundColor Green
