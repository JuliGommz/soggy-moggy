# run-archive-cleanup.ps1
# Archive obsolete dialogue-font artifacts after the 2026-04-22 BlockCraft.otf
# pivot. Moves files with git mv (preserves history) when tracked,
# plain Move-Item when not. Stages everything and commits atomically.

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'
Set-Location -Path $repo
[System.Environment]::CurrentDirectory = $repo

Write-Host '=== Create archive directories (if missing) ===' -ForegroundColor Cyan
New-Item -ItemType Directory -Path '.claude/_executed'   -Force | Out-Null
New-Item -ItemType Directory -Path 'tools/_archive'      -Force | Out-Null
# PixelArt/fonts/Archive already exists — verified

function Archive-File {
    param($src, $destDir)
    if (-not (Test-Path $src)) {
        Write-Host "  skip: $src (not present)" -ForegroundColor Yellow
        return
    }
    $dest = Join-Path $destDir (Split-Path $src -Leaf)
    # Check if file is tracked by git. `git ls-files <path>` (no --error-unmatch)
    # prints the path if tracked, nothing if not; no stderr spam either way.
    $tracked = & git ls-files $src
    if ($tracked) {
        git mv $src $dest
        Write-Host "  git mv: $src -> $dest" -ForegroundColor Green
    } else {
        Move-Item -Path $src -Destination $dest
        Write-Host "  mv:     $src -> $dest" -ForegroundColor Green
    }
}

Write-Host '=== Archive .claude one-shot scripts ===' -ForegroundColor Cyan
Archive-File '.claude/run-english-migration.ps1'      '.claude/_executed'
Archive-File '.claude/run-english-migration-fix.ps1'  '.claude/_executed'
Archive-File '.claude/run-commit.ps1'                  '.claude/_executed'
Archive-File '.claude/run-commit-phase2.ps1'           '.claude/_executed'
Archive-File '.claude/commit-message.txt'              '.claude/_executed'
Archive-File '.claude/commit-message-phase2.txt'       '.claude/_executed'

Write-Host '=== Archive black-alphabet assets ===' -ForegroundColor Cyan
Archive-File 'PixelArt/fonts/alphabet_black_230px.png' 'PixelArt/fonts/Archive'
Archive-File 'PixelArt/fonts/alphabet_black.ai'        'PixelArt/fonts/Archive'

Write-Host '=== Archive redundant yellow atlas JSON (atlas inlined in dialogue.js) ===' -ForegroundColor Cyan
Archive-File 'PixelArt/fonts/alphabet_yellow_red.json' 'PixelArt/fonts/Archive'

Write-Host '=== Archive glyph extractor tool ===' -ForegroundColor Cyan
Archive-File 'tools/glyph-extractor.html'              'tools/_archive'

Write-Host '=== Stage remaining doc changes ===' -ForegroundColor Cyan
git add -A

Write-Host '=== Pre-commit status ===' -ForegroundColor Cyan
git status --short
Write-Host ''

Write-Host '=== Commit ===' -ForegroundColor Cyan
git commit -F .claude/archive-commit-msg.txt

Write-Host ''
Write-Host '=== Done. Last 3 commits: ===' -ForegroundColor Green
git log --oneline -3
