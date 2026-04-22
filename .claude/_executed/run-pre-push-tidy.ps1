# Pre-push tidy: archive the QA one-shot script + commit leftover PDF tidy
# and HTML tweak. One small follow-up commit so the branch is clean for push.

$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'
[System.Environment]::CurrentDirectory = (Get-Location).Path

Write-Host '=== Move QA one-shot into _executed/ ===' -ForegroundColor Cyan
$src = '.claude/run-commit-qa-fixes.ps1'
if (Test-Path $src) {
    Move-Item -Path $src -Destination '.claude/_executed/run-commit-qa-fixes.ps1'
    Write-Host '  moved: run-commit-qa-fixes.ps1 -> _executed/'
}

Write-Host '=== Stage everything remaining ===' -ForegroundColor Cyan
git add -A
git status --short

Write-Host ''
Write-Host '=== Commit ===' -ForegroundColor Cyan
$msg = 'chore(docs): tidy presentation files + archive qa-fix one-shot'
git commit -m $msg

Write-Host ''
Write-Host '=== Last 3 commits ===' -ForegroundColor Green
git log --oneline -3
