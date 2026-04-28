"""
update_gdd.py v2 — patches GDD_Julian_Gomez.docx with 8 submission fixes.
Run: python update_gdd.py
"""

import zipfile, shutil
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX_IN  = Path(__file__).parent / "GDD_Julian_Gomez.docx"
DOCX_OUT = Path(__file__).parent / "GDD_Julian_Gomez.docx"
WORK_DIR = Path(__file__).parent / "_gdd_work"

# ---------------------------------------------------------------------------
# Namespace
# ---------------------------------------------------------------------------
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"

def wtag(local):
    return f"{{{W}}}{local}"

# ---------------------------------------------------------------------------
# Step 1 — unzip
# ---------------------------------------------------------------------------
if WORK_DIR.exists():
    shutil.rmtree(WORK_DIR)
WORK_DIR.mkdir(parents=True)

print(f"Unpacking {DOCX_IN.name} …")
with zipfile.ZipFile(DOCX_IN, "r") as z:
    z.extractall(WORK_DIR)

# ---------------------------------------------------------------------------
# Step 2 — parse; register all namespaces so round-trip preserves them
# ---------------------------------------------------------------------------
DOC_XML = WORK_DIR / "word" / "document.xml"

for event, (prefix, uri) in ET.iterparse(str(DOC_XML), events=["start-ns"]):
    try:
        ET.register_namespace(prefix, uri)
    except Exception:
        pass

tree = ET.parse(str(DOC_XML))
root = tree.getroot()
body = root.find(f".//{wtag('body')}")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def para_text(p):
    """Concatenate all w:t text in paragraph (including inside table cells etc.)."""
    return "".join(t.text or "" for t in p.iter(wtag("t")))

def all_paras(start_elem=None):
    """Yield (para, parent) for every w:p under start_elem (default: body)."""
    root_el = start_elem if start_elem is not None else body
    def _recurse(parent):
        for child in parent:
            if child.tag == wtag("p"):
                yield child, parent
            else:
                yield from _recurse(child)
    yield from _recurse(root_el)

def find_para(keyword, start_elem=None):
    """Return (para, parent) for first paragraph containing keyword."""
    for para, parent in all_paras(start_elem):
        if keyword in para_text(para):
            return para, parent
    return None, None

def body_children():
    return list(body)

def find_body_idx(keyword, start=0):
    """Index into direct body children for first w:p containing keyword, starting at start."""
    for i, el in enumerate(body_children()):
        if i < start:
            continue
        if el.tag == wtag("p") and keyword in para_text(el):
            return i
        # also check paragraphs inside tables at body level
        if el.tag == wtag("tbl"):
            for p in el.iter(wtag("p")):
                if keyword in para_text(p):
                    return i  # return the tbl index
    return -1

def replace_text_in_para(para, old, new):
    """Replace old→new across all w:t elements in a paragraph (handles split runs)."""
    # Collect all t elements
    t_elems = list(para.iter(wtag("t")))
    full = "".join(t.text or "" for t in t_elems)
    if old not in full:
        return False
    new_full = full.replace(old, new)
    # Put all text in first t, clear the rest
    if t_elems:
        t_elems[0].text = new_full
        t_elems[0].set(XML_SPACE, "preserve")
        for t in t_elems[1:]:
            t.text = ""
    return True

def make_para(text, bold=False, style=None):
    p = ET.Element(wtag("p"))
    pPr = ET.SubElement(p, wtag("pPr"))
    if style:
        ps = ET.SubElement(pPr, wtag("pStyle"))
        ps.set(wtag("val"), style)
    r = ET.SubElement(p, wtag("r"))
    if bold:
        rPr = ET.SubElement(r, wtag("rPr"))
        ET.SubElement(rPr, wtag("b"))
    t = ET.SubElement(r, wtag("t"))
    t.text = text
    t.set(XML_SPACE, "preserve")
    return p

def make_table(rows, col_widths):
    """rows[0] is the header row. col_widths in DXA."""
    tbl = ET.Element(wtag("tbl"))
    tblPr = ET.SubElement(tbl, wtag("tblPr"))
    ts = ET.SubElement(tblPr, wtag("tblStyle"))
    ts.set(wtag("val"), "TableGrid")
    tW = ET.SubElement(tblPr, wtag("tblW"))
    tW.set(wtag("w"), str(sum(col_widths)))
    tW.set(wtag("type"), "dxa")
    tg = ET.SubElement(tbl, wtag("tblGrid"))
    for cw in col_widths:
        gc = ET.SubElement(tg, wtag("gridCol"))
        gc.set(wtag("w"), str(cw))
    for i, row in enumerate(rows):
        tr = ET.SubElement(tbl, wtag("tr"))
        if i == 0:
            trPr = ET.SubElement(tr, wtag("trPr"))
            ET.SubElement(trPr, wtag("tblHeader"))
        for j, cell_text in enumerate(row):
            tc = ET.SubElement(tr, wtag("tc"))
            tcPr = ET.SubElement(tc, wtag("tcPr"))
            tcW = ET.SubElement(tcPr, wtag("tcW"))
            tcW.set(wtag("w"), str(col_widths[j]))
            tcW.set(wtag("type"), "dxa")
            p = ET.SubElement(tc, wtag("p"))
            r = ET.SubElement(p, wtag("r"))
            if i == 0:
                rPr = ET.SubElement(r, wtag("rPr"))
                ET.SubElement(rPr, wtag("b"))
            t = ET.SubElement(r, wtag("t"))
            t.text = cell_text
            t.set(XML_SPACE, "preserve")
    return tbl

# ---------------------------------------------------------------------------
# Step 3 — apply changes
# ---------------------------------------------------------------------------
changes = []

# ── 1: Abgabedatum ──────────────────────────────────────────────────────────
p, parent = find_para("verschoben")
if p is None:
    p, parent = find_para("Abgabedatum")
if p is not None and ("verschoben" in para_text(p) or "ausstehend" in para_text(p)):
    old_val = para_text(p)
    # The cell just contains the value "verschoben (neues Datum …)"
    if replace_text_in_para(p, old_val, "27.04.2026"):
        changes.append("1: Abgabedatum → 27.04.2026")
    else:
        changes.append("1: SKIPPED — replace_text failed")
else:
    # Try: find the cell after the label "Abgabedatum"
    found = False
    for tbl in body.iter(wtag("tbl")):
        rows = list(tbl.iter(wtag("tr")))
        for tr in rows:
            cells = list(tr.findall(wtag("tc")))
            for ci, tc in enumerate(cells):
                cell_txt = "".join(para_text(p2) for p2 in tc.iter(wtag("p")))
                if "Abgabedatum" in cell_txt and ci == 0:
                    # value cell is next
                    if ci + 1 < len(cells):
                        val_tc = cells[ci + 1]
                        for vp in val_tc.iter(wtag("p")):
                            vt = list(vp.iter(wtag("t")))
                            if vt:
                                old = "".join(t.text or "" for t in vt)
                                vt[0].text = "27.04.2026"
                                for t in vt[1:]:
                                    t.text = ""
                                changes.append("1: Abgabedatum → 27.04.2026 (table-cell scan)")
                                found = True
                                break
                if found:
                    break
            if found:
                break
        if found:
            break
    if not found:
        changes.append("1: SKIPPED — could not locate Abgabedatum value cell")

# ── 2: §1.5 Audio bullet — Web Audio API → HTMLAudio API ──────────────────
found2 = False
for para, parent in all_paras():
    txt = para_text(para)
    if "Web Audio API" in txt and "Bekannte" not in txt and "Vollimplementierung" not in txt:
        for t in para.iter(wtag("t")):
            if "Web Audio API" in (t.text or ""):
                t.text = t.text.replace(
                    "Web Audio API",
                    "HTMLAudio API (file:// kompatibel, kein XHR, läuft auf Firefox und Chromium)"
                )
                t.set(XML_SPACE, "preserve")
                found2 = True
        if found2:
            changes.append("2: §1.5 Audio bullet: Web Audio API → HTMLAudio API")
            break
if not found2:
    changes.append("2: SKIPPED — Web Audio API not found outside Bekannte/Vollimplementierung")

# ── 3: §2.1 opening sentence ───────────────────────────────────────────────
p, _ = find_para("drei Hauptzust")
if p is not None:
    if replace_text_in_para(p, "drei Hauptzuständen", "zehn Zuständen (GamePhase)"):
        changes.append("3: §2.1 'drei' → 'zehn Zuständen (GamePhase)'")
    else:
        changes.append("3: SKIPPED — replace failed inside para")
else:
    changes.append("3: SKIPPED — 'drei Hauptzust' not found")

# ── 4: §2.8 Start-Leben ────────────────────────────────────────────────────
p, _ = find_para("Herz-Icons")
if p is None:
    p, _ = find_para("Start-Leben")
if p is not None:
    old = para_text(p)
    new = (
        "Start-Leben: abhängig vom Schwierigkeitsgrad "
        "(Explorer: 5, Adventurer: 3, Enlightened: 2) — "
        "dargestellt als Cat-Icons im HUD (max. 9 sichtbar). Siehe Abschnitt 2.13."
    )
    if replace_text_in_para(p, old, new):
        changes.append("4: §2.8 Start-Leben updated")
    else:
        changes.append("4: SKIPPED — replace_text failed")
else:
    changes.append("4: SKIPPED — Herz-Icons / Start-Leben not found")

# ── 5: §3.5 — delete stale L2 note ─────────────────────────────────────────
p, parent = find_para("Phase 5 erstellt")
if p is not None:
    parent.remove(p)
    changes.append("5: §3.5 stale L2 note deleted")
else:
    changes.append("5: SKIPPED — 'Phase 5 erstellt' not found")

# ── 6: §3.8 heading — Audio-Konzept → Audio-System ────────────────────────
p, _ = find_para("Audio-Konzept")
if p is not None:
    for t in p.iter(wtag("t")):
        if "Audio-Konzept" in (t.text or ""):
            t.text = t.text.replace("Audio-Konzept", "Audio-System")
    changes.append("6: §3.8 heading Audio-Konzept → Audio-System")
else:
    changes.append("6: SKIPPED — Audio-Konzept not found")

# ── 7: §3.8 body — replace placeholder block with real content ─────────────
start_idx = find_body_idx("Vollimplementierung")
# Find Typografie AFTER start_idx (avoids TOC hit)
end_idx = find_body_idx("Typografie", start=start_idx + 1) if start_idx >= 0 else -1

if start_idx >= 0 and end_idx > start_idx:
    bc = body_children()
    els_to_remove = bc[start_idx:end_idx]
    for el in els_to_remove:
        body.remove(el)

    # Find new insertion point (Typografie is now shifted)
    bc2 = body_children()
    new_end = next(
        (i for i, el in enumerate(bc2)
         if el.tag == wtag("p") and "Typografie" in para_text(el)),
        len(bc2)
    )

    new_els = []
    new_els.append(make_para(
        "Das Spiel verwendet HTMLAudio API für alle Sound-Events und Musik "
        "(implementiert in src/audio.js). Die Web Audio API wurde bewusst nicht "
        "eingesetzt, da Firefox XHR-Anfragen auf file:// blockiert "
        "(Begründung vollständig in Abschnitt „Bekannte Einschränkungen“)."
    ))
    new_els.append(make_para("SOUNDS-Map (31 Einträge):", bold=True))
    new_els.append(make_table(
        [
            ["Kategorie", "Keys", "Beschreibung"],
            ["SFX — Spieler",
             "jump, land, damage, balloon_collect, stomp_bounce, respawn",
             "Bewegungs- und Interaktions-Sounds"],
            ["SFX — UI",
             "game_over, level_complete, menu_click, menu_nav, countdown_tick",
             "Interface-Feedback und Menü-Navigation"],
            ["SFX — Outro-Trigger",
             "windrad, bell, l3_lever, water_drain, l1/l2/l3_outro_bubble",
             "Levelabschluss-Sounds, jeweils levelspezifisch"],
            ["SFX — Gegner",
             "wasp_sting, wasp_death, wasp_buzz",
             "Wespen-Interaktionen"],
            ["SFX — Gefahren (Ambient)",
             "smog_ambient, electricity_ambient, flood_ambient",
             "Proximity-gesteuerte Umgebungsgeräusche"],
            ["SFX — Plattformen",
             "crumble, electro_crumble",
             "Brüchige Plattform-Events (L1 / L2)"],
            ["Musik",
             "music_start, music_l1, music_l2, music_l3, music_victory",
             "Start-Menü + ein Track pro Level + Sieg-Jingle"],
        ],
        [2500, 3700, 3000]
    ))
    new_els.append(make_para("Wichtige Systeme:", bold=True))
    for bullet in [
        "Preload-Cache: Alle SFX-Einträge werden beim Seitenlade-Vorgang in "
        "HTMLAudio-Elemente vorgeladen. Musik wird bei Bedarf gestreamt.",
        "Phasen-Hooks: Übergänge zwischen GamePhase-Zuständen triggern "
        "automatisch passende Sounds. Beispiele: GAMEOVER → game_over.mp3 + Game "
        "Over Screen mounten; LEVEL_OUTRO (L1) → l1_outro_bubble.mp3 + Musik "
        "ausblenden; LEVEL_COMPLETE (L3) → Highscore speichern + Success Screen mounten.",
        "Wasp-Buzz-Proximity: Ein looping HTMLAudio-Element (wasp_buzz.mp3), dessen "
        "Lautstärke quadratisch mit dem Abstand zur nächsten lebenden Wespe "
        "skaliert (Reichweite 350 px, Maximum 55 % des SFX-Volumes).",
        "Hazard-Ambient-Proximity: Die drei levelspezifischen Umgebungsgeräusche "
        "(Smog, Strom, Flut) werden über denselben Proximity-Mechanismus gesteuert "
        "und verstärken sich mit sinkendem Abstand zum Hazard.",
        "Trim-Werte: Pixabay-MP3-Dateien enthalten typischerweise 20–50 ms "
        "encoder-bedingte Stille am Dateianfang (LAME/FFmpeg Priming-Frames). "
        "Diese wird über start-Offsets im SOUNDS-Mapping übersprungen.",
        "Audio-Grundsatz: Keine aggressiven oder erschreckenden Sounds. Alle "
        "Klänge unterstützen die „cozy danger“-Stimmung des Spiels.",
    ]:
        new_els.append(make_para(bullet))

    for j, el in enumerate(new_els):
        body.insert(new_end + j, el)

    changes.append(
        f"7: §3.8 body replaced (removed {len(els_to_remove)} elements, "
        f"inserted {len(new_els)})"
    )
else:
    changes.append(
        f"7: SKIPPED — start={start_idx} end={end_idx}"
    )

# ── 8: date 16.04.2026 → 27.04.2026 ──────────────────────────────────────
found8 = False
for para, _ in all_paras():
    txt = para_text(para)
    if "16.04.2026" in txt:
        for t in para.iter(wtag("t")):
            if "16.04.2026" in (t.text or ""):
                t.text = t.text.replace("16.04.2026", "27.04.2026")
                found8 = True
        if found8:
            changes.append("8: date 16.04.2026 → 27.04.2026")
            break
if not found8:
    # Also check footer
    footer_xml = WORK_DIR / "word" / "footer1.xml"
    if footer_xml.exists():
        ft = ET.parse(str(footer_xml))
        for t in ft.iter(wtag("t")):
            if "16.04.2026" in (t.text or ""):
                t.text = t.text.replace("16.04.2026", "27.04.2026")
                found8 = True
        if found8:
            ft.write(str(footer_xml), xml_declaration=True,
                     encoding="UTF-8", short_empty_elements=True)
            changes.append("8: date 16.04.2026 → 27.04.2026 (footer)")
    if not found8:
        changes.append("8: SKIPPED — '16.04.2026' not found")

# ---------------------------------------------------------------------------
# Step 4 — write document.xml
# ---------------------------------------------------------------------------
tree.write(str(DOC_XML), xml_declaration=True, encoding="UTF-8", short_empty_elements=True)
print("document.xml written.")

# ---------------------------------------------------------------------------
# Step 5 — repack
# ---------------------------------------------------------------------------
DOCX_OUT.unlink(missing_ok=True)
with zipfile.ZipFile(DOCX_OUT, "w", compression=zipfile.ZIP_DEFLATED) as zout:
    for fpath in sorted(WORK_DIR.rglob("*")):
        if fpath.is_file():
            zout.write(fpath, fpath.relative_to(WORK_DIR))

print(f"Repacked → {DOCX_OUT.name}")
shutil.rmtree(WORK_DIR)

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
print("\n=== Changes ===")
for c in changes:
    print(f"  {'✓' if 'SKIPPED' not in c else '⚠'} {c}")
print("\nDone.")
