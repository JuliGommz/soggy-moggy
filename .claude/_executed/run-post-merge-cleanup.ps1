# Run AFTER the GitHub PR for chore/project-cleanup-2026-04-21 is merged.
# Syncs local master, deletes merged branches locally + on origin.

$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'

Write-Host '=== Sync local master ===' -ForegroundColor Cyan
git checkout master
git pull origin master

Write-Host ''
Write-Host '=== Verify all target branches are now merged ===' -ForegroundColor Cyan
git branch --merged master

Write-Host ''
Write-Host '=== Delete local merged branches ===' -ForegroundColor Cyan
$local = @(
    'feature/04.2-l2-lighthouse',
    'feature/asset-restructure-mechanics',
    'feature/04.3-l2-elevator-interior',
    'chore/project-cleanup-2026-04-21'
)
foreach ($b in $local) {
    git branch -d $b
}

Write-Host ''
Write-Host '=== Delete remote branches on origin ===' -ForegroundColor Cyan
$remote = @(
    'feature/04.2-l2-lighthouse',
    'feature/04.3-l2-elevator-interior',
    'chore/project-cleanup-2026-04-21'
)
foreach ($b in $remote) {
    git push origin --delete $b
}

Write-Host ''
Write-Host '=== Prune stale remote-tracking refs ===' -ForegroundColor Cyan
git remote prune origin

Write-Host ''
Write-Host '=== Final state ===' -ForegroundColor Green
git branch -vv
git log --oneline --graph --all -10
