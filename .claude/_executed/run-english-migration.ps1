# run-english-migration.ps1
# One-shot: rename Dokumente_Schule subfolders + patch deps + commit
# everything (including pre-existing English-migration text edits).
# After successful run, this file can be deleted.

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'
Set-Location -Path $repo

Write-Host '=== Pre-flight ===' -ForegroundColor Cyan
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Branch: $branch"
Write-Host 'Working-tree status (uncommitted text edits from yesterday expected):'
git status --short
Write-Host ''

Write-Host '=== Step 1: git mv 3 folders ===' -ForegroundColor Cyan
git mv 'Dokumente_Schule/Ausgefuellt' 'Dokumente_Schule/Completed'
git mv 'Dokumente_Schule/Vorlagen'    'Dokumente_Schule/Templates'
git mv 'Dokumente_Schule/Einreichung' 'Dokumente_Schule/Submission'
Write-Host 'OK: 3 folders renamed via git mv (history preserved)'
Write-Host ''

Write-Host '=== Step 2: patch dependency references ===' -ForegroundColor Cyan
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Patch-File {
    param($path, $old, $new)
    $content = [System.IO.File]::ReadAllText($path)
    if (-not $content.Contains($old)) {
        Write-Host "  WARN: '$old' not found in $path - skipping" -ForegroundColor Yellow
        return
    }
    $content = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
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
- Updated in all 9 source-file headers, title screen string (main.js:526),
  planning docs (.planning/, docs/plans/), PixelArt READMEs, school doc
  titles (GDD + create_docs.js).

Folder restructure (Dokumente_Schule):
- Ausgefuellt  -> Completed
- Vorlagen     -> Templates
- Einreichung  -> Submission
- Updated path references in .gitignore, .claude/run-phase8.ps1,
  docs/plans/2026-04-21-project-cleanup.md.

Planning + state:
- New language-policy section in .planning/PROJECT.md.
- STATE.md: superseded "Game language: Spanish" decision, added "Game
  language: English", school paths updated, next actions point to
  Translator Agent phase + Dialogue System retake.
- Session log: .planning/logs/2026-04-21-english-migration-audit.md

Pending (next phase, not part of this commit):
- In-game Spanish strings (HUD labels, menu options, dialogue prompts)
  -> English via dedicated Translator Agent.
- German level names (Stadt/Aufzugschacht/Offener See/Freizeitpark)
  -> English in same phase.
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
