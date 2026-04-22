# Pre-push: consolidate uncommitted work + push cleanup branch to origin.
# After this runs, Julian opens the GitHub PR URL shown in the push output
# and clicks Merge. Then runs run-git-post-merge.ps1 for the cleanup.

$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'

Write-Host '=== 1/4 Archive unused helper scripts to .claude/_executed/ ===' -ForegroundColor Cyan
$helpers = @(
    '.claude/run-commit-qa-fixes.ps1',
    '.claude/run-pre-push-tidy.ps1',
    '.claude/run-post-merge-cleanup.ps1'
)
foreach ($h in $helpers) {
    if (Test-Path $h) {
        Move-Item -Path $h -Destination '.claude/_executed/' -Force
        Write-Host "  moved: $h"
    } else {
        Write-Host "  skip:  $h (not present)"
    }
}

Write-Host ''
Write-Host '=== 2/4 Stage + commit remaining working-tree changes ===' -ForegroundColor Cyan
git add -A
Write-Host 'Staged:'
git status --short
git commit -m "chore(docs): tidy presentation files + archive one-shot helpers"

Write-Host ''
Write-Host '=== 3/4 Push cleanup branch (first push, -u sets upstream) ===' -ForegroundColor Cyan
git push -u origin chore/project-cleanup-2026-04-21

Write-Host ''
Write-Host '=== 4/4 Ready for GitHub PR ===' -ForegroundColor Green
git log --oneline -5
Write-Host ''
Write-Host 'NEXT: Open the "Create pull request" URL shown above in your browser,'  -ForegroundColor Yellow
Write-Host '      review the diff, merge into master on GitHub.'                     -ForegroundColor Yellow
Write-Host '      AFTER the merge: powershell -ExecutionPolicy Bypass -File .claude\run-git-post-merge.ps1' -ForegroundColor Yellow
