# Commit QA-review fixes (language/title leftovers found by verification agent).
$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26'

git add .planning/ROADMAP.md Dokumente_Schule/Medienkatalog.md
git status --short
git commit -m "chore(docs): apply QA findings - Spanish/Gato leftovers in ROADMAP + Medienkatalog title"
git log --oneline -3
