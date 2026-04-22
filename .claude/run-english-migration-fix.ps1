# run-english-migration-fix.ps1
# Fix-up after the first run's partial failures:
#   1. Vorlagen -> Templates via Move-Item (git mv failed; folder is gitignored)
#   2. Dep-file patches with correct .NET current-directory
#   3. Stage + commit everything in one atomic commit.

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'
Set-Location -Path $repo
[System.Environment]::CurrentDirectory = $repo   # critical: .NET IO uses its own CWD

Write-Host '=== Pre-check ===' -ForegroundColor Cyan
Write-Host 'Folders in Dokumente_Schule:'
Get-ChildItem 'Dokumente_Schule' -Directory | Format-Table Name
Write-Host 'Git status (short):'
git status --short
Write-Host ''

Write-Host '=== Step 1: Vorlagen -> Templates (Move-Item, gitignored) ===' -ForegroundColor Cyan
if (Test-Path 'Dokumente_Schule\Vorlagen') {
    if (Test-Path 'Dokumente_Schule\Templates') {
        Write-Host 'ERROR: Both Vorlagen and Templates exist. Aborting.' -ForegroundColor Red
        exit 1
    }
    Move-Item -Path 'Dokumente_Schule\Vorlagen' -Destination 'Dokumente_Schule\Templates'
    Write-Host 'OK: Vorlagen -> Templates'
} else {
    Write-Host 'Skip: Vorlagen folder not present (already renamed?)'
}
Write-Host ''

Write-Host '=== Step 2: patch dependency files ===' -ForegroundColor Cyan
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Patch-File {
    param($path, $old, $new)
    $abs = Join-Path $repo $path
    if (-not (Test-Path $abs)) {
        Write-Host "  ERROR: file not found: $abs" -ForegroundColor Red
        return
    }
    $content = [System.IO.File]::ReadAllText($abs)
    if (-not $content.Contains($old)) {
        Write-Host "  WARN: '$old' not found in $path - skipping" -ForegroundColor Yellow
        return
    }
    $content = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($abs, $content, $utf8NoBom)
    Write-Host "  OK: $path"
}

Patch-File '.claude/run-phase8.ps1' `
    'Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.md' `
    'Dokumente_Schule/Completed/GDD_Julian_Gomez.md'

Patch-File '.gitignore' `
    'Dokumente_Schule/Einreichung/unpacked_check/' `
    'Dokumente_Schule/Submission/unpacked_check/'

Patch-File '.gitignore' `
    'Dokumente_Schule/Einreichung/*.docx' `
    'Dokumente_Schule/Submission/*.docx'

Patch-File '.gitignore' `
    'Dokumente_Schule/Vorlagen/' `
    'Dokumente_Schule/Templates/'

Patch-File 'docs/plans/2026-04-21-project-cleanup.md' `
    'Dokumente_Schule/Ausgefuellt/GDD_Julian_Gomez.md' `
    'Dokumente_Schule/Completed/GDD_Julian_Gomez.md'
Write-Host ''

Write-Host '=== Step 3: stage all changes ===' -ForegroundColor Cyan
git add -A
Write-Host ''

Write-Host '=== Step 4: pre-commit verification ===' -ForegroundColor Cyan
git status --short
Write-Host ''

Write-Host '=== Step 5: commit ===' -ForegroundColor Cyan
$msg = @"
feat(i18n): English-only migration phase 1

Title rename:
- Sole official title is now "Soggy Moggy" (was: "Gato Sin Botas")
- Updated in all 9 source-file headers, title screen string
  (src/main.js:526), planning docs (.planning/, docs/plans/),
  PixelArt READMEs, school doc titles (GDD + create_docs.js).

Folder restructure (Dokumente_Schule):
- Ausgefuellt  -> Completed
- Vorlagen     -> Templates (Move-Item; gitignored, not tracked)
- Einreichung  -> Submission
- Updated path references in .gitignore, .claude/run-phase8.ps1,
  docs/plans/2026-04-21-project-cleanup.md.

Planning + state:
- New language-policy section in .planning/PROJECT.md.
- STATE.md: superseded "Game language: Spanish" decision, added
  "Game language: English", school paths updated, next actions
  point to Translator Agent phase + Dialogue System retake.
- Session log: .planning/logs/2026-04-21-english-migration-audit.md

Pending (next phase, not part of this commit):
- In-game Spanish strings -> English via dedicated Translator Agent.
- German level names -> English in same phase.
- index.html lang="de" -> lang="en".
- Dialogue System retake with bitmap-font-atlas approach.
"@
git commit -m $msg
Write-Host ''

Write-Host '=== Done ===' -ForegroundColor Green
git log --oneline -3
Write-Host ''
Write-Host 'Dokumente_Schule structure after migration:'
Get-ChildItem 'Dokumente_Schule' -Directory | Format-Table Name
