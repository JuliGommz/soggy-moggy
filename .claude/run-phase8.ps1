# Phase 8 — Doku-Sync (Drift abbauen, Plan-Indizes, Superseded-Banner)
# Branch: chore/project-cleanup-2026-04-21
# Atomarer Commit, keine Wildcards.

$ErrorActionPreference = 'Stop'

$repo = 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'
Set-Location -Path $repo

$files = @(
    'PixelArt/NAMING.md',
    'docs/ASSET_LIST.md',
    'Dokumente_Schule/Completed/GDD_Julian_Gomez.md',
    'docs/plans/2026-04-07-l2-cloud-platforms-design.md',
    'docs/plans/2026-04-07-l2-cloud-platforms-impl.md',
    'docs/plans/2026-04-18-dialogue-system-design.md',
    'docs/plans/2026-04-20-dialogue-bubbles-illustrator.md',
    'docs/plans/2026-04-21-project-cleanup.md',
    'docs/plans/2026-04-21-phase3-asset-groups.md',
    'docs/plans/README.md'
)

foreach ($f in $files) {
    git add -- $f
}

$msg = @"
cleanup(phase8): Doku-Sync - Drift abbauen, Plan-Indizes, Superseded-Banner

- NAMING.md: Level-Ordner-Regel auf level_N_theme aktualisiert (L2=shaft,
  L3=sea), neue Sektion platforms/level_2_lift/, Beispiel auf level_2_shaft
  umgestellt.
- ASSET_LIST.md: L2/L3-Tausch eingepflegt, L2 shaft Jump-Platform Sheet
  ergaenzt, Rocket-Sprites als REMOVED markiert (Phase 6), Dialogue-PNG
  Blocker in 'Still Missing' ergaenzt, Update-Datum gesetzt.
- GDD_Julian_Gomez.md: Deadline auf 'verschoben (neues Datum ausstehend)'.
- Superseded-Banner:
    * 2026-04-07-l2-cloud-platforms-design.md  -> L2 Shaft Platforms
    * 2026-04-07-l2-cloud-platforms-impl.md    -> L2 Shaft Platforms
    * 2026-04-18-dialogue-system-design.md     -> Phase 5 / src/dialogue.js
    * 2026-04-20-dialogue-bubbles-illustrator.md (partial) -> Cleanup Ph5
    * 2026-04-21-project-cleanup.md            -> Status-Zeile executed 0-7
    * 2026-04-21-phase3-asset-groups.md        -> Status-Zeile executed
- docs/plans/README.md: Chronologischer Planungs-Index neu angelegt.

Keine Code-Aenderungen. Rein dokumentarisch.
"@

git commit -m $msg

Write-Host ''
Write-Host '--- letzte 8 Commits ---'
git log --oneline -8
