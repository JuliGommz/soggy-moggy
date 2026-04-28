"""
diag_gdd.py — prints actual paragraph texts for the 4 skipped changes.
Run: python diag_gdd.py
"""
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX = Path(__file__).parent / "GDD_Julian_Gomez.docx"
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

def wtag(l): return f"{{{W}}}{l}"

def para_text(p):
    return "".join(t.text or "" for t in p.iter(wtag("t")))

# Unzip to memory
import io, os, tempfile, shutil
work = Path(tempfile.mkdtemp())
with zipfile.ZipFile(DOCX) as z:
    z.extractall(work)

for ns_ev, ns_data in ET.iterparse(str(work / "word" / "document.xml"), events=["start-ns"]):
    try: ET.register_namespace(ns_data[0], ns_data[1])
    except: pass

tree = ET.parse(str(work / "word" / "document.xml"))
root = tree.getroot()
body = root.find(f".//{wtag('body')}")

def all_paras():
    def r(parent):
        for child in parent:
            if child.tag == wtag("p"): yield child
            else: yield from r(child)
    yield from r(body)

SEARCH_TERMS = [
    "Abgabedatum",   # Change 1 — find what the value cell actually says
    "verschoben",
    "Zustandsmaschine",  # Change 3 — find the §2.1 paragraph
    "Hauptzust",
    "Phase 5",       # Change 5 — find the stale note
    "erstellt",
    "2026",          # Change 8 — find where date appears
    "Aktualisierung",
]

print("=== Paragraphs matching search terms ===\n")
for term in SEARCH_TERMS:
    hits = [(i, p) for i, p in enumerate(all_paras()) if term in para_text(p)]
    if hits:
        print(f"['{term}'] — {len(hits)} hit(s):")
        for i, p in hits[:4]:
            txt = para_text(p)
            print(f"  para #{i}: {repr(txt[:120])}")
    else:
        print(f"['{term}'] — NOT FOUND")
    print()

# Also scan all table cells for Abgabedatum
print("=== Table cell scan for 'Abgabedatum' ===")
for tbl_i, tbl in enumerate(body.iter(wtag("tbl"))):
    for row_i, tr in enumerate(tbl.iter(wtag("tr"))):
        cells = list(tr.findall(wtag("tc")))
        for ci, tc in enumerate(cells):
            ct = "".join(para_text(p) for p in tc.iter(wtag("p")))
            if "Abgabedatum" in ct or "verschoben" in ct or "27.04" in ct or "22.04" in ct:
                print(f"  tbl#{tbl_i} row#{row_i} cell#{ci}: {repr(ct[:120])}")

shutil.rmtree(work)
print("\nDone.")
