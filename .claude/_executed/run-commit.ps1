# run-commit.ps1
# Minimal: commit what is currently staged using the prepared message file.

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'
Set-Location -Path $repo

Write-Host '=== Commit ===' -ForegroundColor Cyan
git commit -F .claude/commit-message.txt
Write-Host ''

Write-Host '=== Last 3 commits ===' -ForegroundColor Green
git log --oneline -3
