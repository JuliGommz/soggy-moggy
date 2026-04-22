# Post-merge: sync local master, delete merged branches locally + on origin.
# Run ONLY after the cleanup PR has been merged into master on GitHub.

$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'

Write-Host 'This script requires that the cleanup PR has already been merged on GitHub.' -ForegroundColor Yellow
Write-Host 'Git will refuse to delete unmerged branches (safety), but the error is noisy.' -ForegroundColor Yellow
Read-Host 'Press ENTER to confirm the GitHub merge is done, or Ctrl+C to abort'
Write-Host ''

Write-Host '=== 1/5 Switch to master + pull ===' -ForegroundColor Cyan
git checkout master
git pull origin master

Write-Host ''
Write-Host '=== 2/5 Verify all target branches are merged (safety check) ===' -ForegroundColor Cyan
Write-Host 'Branches merged into master:'
git branch --merged master
Write-Host ''
Write-Host 'Branches NOT merged (should only show * master):'
git branch --no-merged master

Write-Host ''
Write-Host '=== 3/5 Delete local branches ===' -ForegroundColor Cyan
$locals = @(
    'feature/04.2-l2-lighthouse',
    'feature/asset-restructure-mechanics',
    'feature/04.3-l2-elevator-interior',
    'chore/project-cleanup-2026-04-21'
)
foreach ($b in $locals) {
    git branch -d $b
}

Write-Host ''
Write-Host '=== 4/5 Delete remote branches on origin ===' -ForegroundColor Cyan
# Tolerant of missing remote refs — non-existent deletions are logged but do not halt.
$remotes = @(
    'feature/04.2-l2-lighthouse',
    'feature/asset-restructure-mechanics',
    'feature/04.3-l2-elevator-interior',
    'chore/project-cleanup-2026-04-21'
)
$ErrorActionPreference = 'Continue'
foreach ($b in $remotes) {
    git push origin --delete $b
}
$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '=== 5/5 Prune stale remote-tracking refs ===' -ForegroundColor Cyan
git remote prune origin

Write-Host ''
Write-Host '=== Final state ===' -ForegroundColor Green
git branch -vv
Write-Host ''
git log --oneline --graph -10
