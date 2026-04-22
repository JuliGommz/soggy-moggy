# run-commit-phase2.ps1
# Stage + commit the phase-2 translation edits (src + index.html).

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'
Set-Location -Path $repo

Write-Host '=== Pre-commit state ===' -ForegroundColor Cyan
git status --short
Write-Host ''

Write-Host '=== Stage phase 2 files ===' -ForegroundColor Cyan
git add src/main.js src/dialogue.js src/enemies.js index.html
Write-Host ''

Write-Host '=== Diff summary ===' -ForegroundColor Cyan
git diff --cached --stat
Write-Host ''

Write-Host '=== Commit ===' -ForegroundColor Cyan
git commit -F .claude/commit-message-phase2.txt
Write-Host ''

Write-Host '=== Last 3 commits ===' -ForegroundColor Green
git log --oneline -3
