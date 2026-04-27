#!/usr/bin/env python3
"""
Measures opaque-pixel bounding boxes of L3 lighthouse PNGs.
Now covers: lighthouse_sheet3.png (new full sheet), lh_08.06.png (new back layer),
            lh_08.5.png (front overlay), and the legacy lh_08.png for comparison.

Re-run after any asset change. Update the SRC_X/SRC_Y/SRC_W/SRC_H constants in
src/background.js (_drawL2Lighthouse + _drawL3LighthouseFront) with the printed values.

Usage:
    python scripts/measure_lh08_layers.py
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
L3_DIR    = ROOT / "Visuals" / "backgrounds" / "level_3_sea"
SPRITES_DIR = L3_DIR / "EInzel-Sprites"

# (label, path)
TARGETS = [
    ("lighthouse_sheet3.png", L3_DIR     / "lighthouse_sheet3.png"),
    ("lh_08.06.png",          SPRITES_DIR / "lh_08.06.png"),
    ("lh_08.5.png",           SPRITES_DIR / "lh_08.5.png"),
    ("lh_08.png  (legacy)",   SPRITES_DIR / "lh_08.png"),
]


def measure_bbox(path: Path):
    img = Image.open(path).convert("RGBA")
    bbox = img.getbbox()
    if bbox is None:
        return None, img.size
    sx, sy, ex, ey = bbox
    return (sx, sy, ex - sx, ey - sy), img.size


def main():
    print(f"[scan] L3 dir:       {L3_DIR}")
    print(f"[scan] Sprites dir:  {SPRITES_DIR}\n")
    bboxes = {}
    for label, path in TARGETS:
        if not path.exists():
            print(f"  ! MISSING: {label}  ({path})")
            print()
            continue
        bbox, size = measure_bbox(path)
        bboxes[label] = (bbox, size)
        print(f"  {label}")
        print(f"    canvas size: {size[0]} x {size[1]}")
        if bbox is None:
            print(f"    bbox: <fully transparent>")
        else:
            sx, sy, sw, sh = bbox
            print(f"    bbox sx={sx}  sy={sy}  sw={sw}  sh={sh}")
            print(f"         center=({sx + sw // 2}, {sy + sh // 2})")
            print(f"         right-bottom=({sx + sw}, {sy + sh})")
        print()

    # Compare lh_08.06 vs lh_08.5 (the active back + front pair).
    new_back  = bboxes.get("lh_08.06.png", (None, None))[0]
    front     = bboxes.get("lh_08.5.png",  (None, None))[0]
    legacy    = bboxes.get("lh_08.png  (legacy)", (None, None))[0]
    if new_back and front:
        print("[align] lh_08.06 vs lh_08.5:")
        print(f"  back  sx={new_back[0]}  sy={new_back[1]}  sw={new_back[2]}  sh={new_back[3]}  centerX={new_back[0] + new_back[2] // 2}")
        print(f"  front sx={front[0]}     sy={front[1]}     sw={front[2]}     sh={front[3]}      centerX={front[0] + front[2] // 2}")
        front_inside = (front[0] >= new_back[0] and front[1] >= new_back[1]
                        and front[0] + front[2] <= new_back[0] + new_back[2]
                        and front[1] + front[3] <= new_back[1] + new_back[3])
        print(f"  front bbox fits inside back bbox? {front_inside}")
    if new_back and legacy:
        print("\n[delta] lh_08.06 vs legacy lh_08:")
        print(f"  shift: dx={new_back[0] - legacy[0]:+d}  dy={new_back[1] - legacy[1]:+d}")
        print(f"  size:  dw={new_back[2] - legacy[2]:+d}  dh={new_back[3] - legacy[3]:+d}")

    # Suggest a UNIFIED source-crop rect spanning both layers (back + front),
    # which is what the renderer needs.
    if new_back and front:
        usx = min(new_back[0], front[0])
        usy = min(new_back[1], front[1])
        uex = max(new_back[0] + new_back[2], front[0] + front[2])
        uey = max(new_back[1] + new_back[3], front[1] + front[3])
        print("\n[unified] source-crop covering both layers (paste into background.js):")
        print(f"  const SRC_X = {usx}, SRC_Y = {usy}, SRC_W = {uex - usx}, SRC_H = {uey - usy};")


if __name__ == "__main__":
    main()
