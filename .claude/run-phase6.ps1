#Requires -Version 5.1
# ============================================================================
# Phase 6 — Code-Cleanup: L2-Rocket-Dead-Code + keys.shoot entfernen
# ============================================================================
# Atomarer Commit fuer Phase 6 des Cleanup-Plans
# (docs/plans/2026-04-21-project-cleanup.md).
#
# Ausfuehrung:
#   pwsh -File .claude/run-phase6.ps1
# oder:
#   powershell -ExecutionPolicy Bypass -File .claude\run-phase6.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'

# An Repo-Root wechseln (robust gegen working-directory-Drift).
$repoRoot = git rev-parse --show-toplevel
Set-Location $repoRoot

Write-Host "Repo-Root: $repoRoot" -ForegroundColor Cyan
Write-Host ""

# Explizite File-Liste (keine Wildcards — keine Ueberraschungen).
$files = @(
    'src/background.js',
    'src/input.js'
)

Write-Host "Stage Dateien:" -ForegroundColor Cyan
foreach ($f in $files) {
    git add -- $f
    Write-Host "  + $f"
}
Write-Host ""

# Commit-Message: Kurz-Subject + ausfuehrlicher Body.
$subject = 'cleanup(phase6): Rocket-Dead-Code + keys.shoot entfernen'

$body = @'
Phase 6 des Projekt-Cleanup-Plans (docs/plans/2026-04-21-project-cleanup.md).
Reine Dead-Code-Entfernung, keine Refactors, keine Verhaltensaenderung.

src/background.js (entfernt, ~90 Zeilen):
- 5 Image()-Loads fuer Rocket-Assets: _bgL2Landing, _bgL2Bottom,
  _bgL2MidTop, _bgL2ScaffBot, _bgL2ScaffMid (alte Zeilen 52-56).
  Die PNGs liegen ohnehin nur noch unter
  PixelArt/backgrounds/level_3_sea/Archive/; die Loads zeigten auf
  nicht mehr existierende Pfade und lieferten 404 im Hintergrund.
- Rocket-Konstanten-Block: _RKT_SPRITES, _RKT_DRAW_X, _RKT_MID_H
  inkl. PIL-Scan-Kommentar (alte Zeilen 70-79).
- Scaffolding-Konstanten: _SCAF_STEP, _SCAF_START (alte Zeilen 272-273).
- Funktion _drawL2Scaffolding(ctx, camShift) (alte Zeilen 275-292).
- Funktion _drawL2Elements(ctx, camShift) (alte Zeilen 305-343).

Beide Funktionen wurden seit Phase 04.2 (Lighthouse-Replacement) von
nirgendwo mehr aufgerufen — verifiziert per Grep ueber src/*.js.
_drawL2Lighthouse() ersetzt sie vollstaendig und bleibt unberuehrt.

src/input.js (entfernt, 4 Zuweisungen + 1 Feld + 2 Kommentarzeilen):
- keys.shoot-Feld aus const keys-Objekt entfernt.
- 4 Zuweisungen an keys.shoot entfernt (Space keydown/keyup,
  Mouse-Button-0 mousedown/mouseup).
- 2 historische Kommentare in Header/VERSION HISTORY angepasst.
keys.shoot wurde in keiner Datei gelesen — verifiziert per Grep ueber src/*.js.

Zusaetzliche Pruefungen (beide clean):
- console.log / console.warn / console.error / debugger: 0 Hits in src/*.js.
- TODO / FIXME / HACK / TEMP / DEBUG: 0 Hits in src/*.js.

Nicht Teil dieses Commits:
- Rocket-PNGs unter PixelArt/backgrounds/level_3_sea/Archive/ bleiben
  vorerst liegen (separate Entscheidung: endgueltig nach
  PixelArt/_archive/rocket_v1/ verschieben oder so belassen).
- docs/ASSET_LIST.md erwaehnt die Rocket-Assets historisch — Doku-Sync
  laeuft in Phase 8.

Smoke-Test nach Commit (manuell): Browser-Reload, L1 -> L2 -> L3
spielbar, Console ohne Errors.
'@

Write-Host "Commit:" -ForegroundColor Cyan
git commit -m $subject -m $body

Write-Host ""
Write-Host "Letzte Commits:" -ForegroundColor Cyan
git log --oneline -6
