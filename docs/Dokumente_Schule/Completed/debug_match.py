from docx import Document
from pathlib import Path
SRC = Path(__file__).parent / "Arbeitsprotokoll_Julian_Gomez_BACKUP.docx"
doc = Document(SRC)
table = doc.tables[0]
GAPS_KEYS = {
    "13.03.2026", "18.03.2026", "19.03.2026", "20.03.2026", "24.03.2026",
    "26.03.2026", "27.03.2026", "31.03.2026", "01.04.2026", "02.04.2026",
    "03.04.2026", "07.04.2026", "08.04.2026", "09.04.2026", "10.04.2026",
    "13.04.2026", "14.04.2026", "15.04.2026", "16.04.2026", "17.04.2026",
    "20.04.2026", "21.04.2026", "22.04.2026",
}
DASH_VARIANTS = ["", "–", "-", "—"]
print("dash hex:", [hex(ord(c)) for c in "–"])
for ri, row in enumerate(table.rows):
    if ri == 0: continue
    d = row.cells[1].text.strip()
    t = row.cells[2].text.strip()
    if d in GAPS_KEYS:
        match = t in DASH_VARIANTS
        print(f"R{ri:02d} {d} task={t!r} | dash-hex={[hex(ord(c)) for c in t]} | match={match}")
