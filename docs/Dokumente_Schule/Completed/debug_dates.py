from docx import Document
from pathlib import Path
SRC = Path(__file__).parent / "Arbeitsprotokoll_Julian_Gomez_BACKUP.docx"
doc = Document(SRC)
table = doc.tables[0]
for ri, row in enumerate(table.rows[:50]):
    if ri == 0: continue
    d = row.cells[1].text
    t = row.cells[2].text
    print(f"R{ri:02d} | date=[{d!r}] (len={len(d)}) | task=[{t!r}]")
