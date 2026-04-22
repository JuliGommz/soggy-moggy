# Commit the doc-sync pass done after the cleanup PR merged.
# Only tracked files are affected. .planning/ is gitignored and stays local.

$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'

Write-Host '=== Pre-commit status ===' -ForegroundColor Cyan
git status --short

Write-Host ''
Write-Host '=== Stage + commit ===' -ForegroundColor Cyan
git add -A
git commit -m "docs: post-merge sync - remove Gato Sin Botas leftovers, refresh font credits, update submission status"

Write-Host ''
Write-Host '=== Push to master ===' -ForegroundColor Cyan
git push origin master

Write-Host ''
Write-Host '=== Last 3 commits ===' -ForegroundColor Green
git log --oneline -3
