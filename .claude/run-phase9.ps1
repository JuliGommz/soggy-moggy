# Phase 9 — Schul-Abgabe-Artefakte
# Branch: chore/project-cleanup-2026-04-21
# Atomarer Commit, keine Wildcards.

$ErrorActionPreference = 'Stop'

$repo = 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'
Set-Location -Path $repo

$files = @(
    'README.md',
    'Dokumente_Schule/Medienkatalog.md',
    'Dokumente_Schule/USB-Abgabe-Struktur.md',
    'Dokumente_Schule/ABGABE_STATUS.md',
    'docs/video_script.md',
    '.claude/run-phase9.ps1'
)

foreach ($f in $files) {
    git add -- $f
}

$msg = @"
cleanup(phase9): Schul-Abgabe-Artefakte erstellt

- README.md: Projektbeschreibung, Steuerung (verifiziert src/input.js),
  Tech-Stack, Ordnerstruktur, Credits (Vecteezy-Attribution), Schulkontext.
- Dokumente_Schule/Medienkatalog.md: vollstaendige Asset-Inventur mit
  Herkunft und Lizenz, alle Pfade gegen Dateisystem verifiziert.
- Dokumente_Schule/USB-Abgabe-Struktur.md: Ordner-Layout und Checkliste
  fuer den finalen USB-Stick.
- Dokumente_Schule/ABGABE_STATUS.md: Abgabe-Tracker fuer zukuenftige
  Claude-Sessions; Pflichtdokumente, Code-Status, offene Punkte, Next Steps.
- docs/video_script.md: 7-Szenen-Skript (~2:35 min), Sprecher-Text-Entwaerfe,
  Aufnahme-Hinweise.

Keine Code-Aenderungen. Rein dokumentarisch.
Cleanup-Plan Phase 0-9 vollstaendig abgeschlossen.
"@

git commit -m $msg

Write-Host ''
Write-Host '--- letzte 8 Commits ---'
git log --oneline -8
Write-Host ''
Write-Host '==> Phase 9 abgeschlossen.' -ForegroundColor Green
Write-Host '    Noch offen: Dialogue-PNGs, Gameplay-Video, Selbststaendigkeitserklaerung.' -ForegroundColor Yellow
