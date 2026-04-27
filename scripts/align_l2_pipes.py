"""Align L2 shaft pipe columns across pipes_mid / pipes_top / pipes_bottom.

Background: the three PNGs are stacked at x=0 in src/background.js (_drawL3Mid).
Where they overlap vertically (cap zone, bottom zone), misaligned pipe columns
between the PNGs show up as a horizontal ghost — the "double placement" seen
in-game. pipes_mid.png is the reference (most visible surface); the other two
should match its pipe x-ranges exactly.

Usage:
  python scripts/align_l2_pipes.py                    # measure + report only
  python scripts/align_l2_pipes.py --apply            # shift top+bot to match mid; saves .bak
  python scripts/align_l2_pipes.py --revert           # restore from .bak
  python scripts/align_l2_pipes.py --lock             # delete .bak (confirm fix)
"""
from PIL import Image
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
BG_DIR = ROOT / "Visuals" / "backgrounds" / "level_2_shaft"
PATHS = {
    "mid": BG_DIR / "pipes_mid.png",
    "top": BG_DIR / "pipes_top.png",
    "bot": BG_DIR / "pipes_bottom.png",
}
# Scan row per image: pick a y where clean pipe content exists (no grey band,
# no cap flange). Tuned from visual inspection of the three PNGs.
SCAN_ROWS = {"mid": 400, "top": 500, "bot": 300}


def is_orange(px):
    r, g, b, a = px
    if a < 128:
        return False
    if r < 120:
        return False
    if g >= r or b >= g:
        return False
    return (r - b) > 40


def find_pipe_cols(img, y):
    """Return list of (x_start, x_end) ranges of orange pipe columns at row y.

    Merges gaps <=3 px so the dark ring band doesn't split a column.
    """
    w, _ = img.size
    px = img.load()
    hits = [is_orange(px[x, y]) for x in range(w)]
    ranges = []
    start = None
    for x, h in enumerate(hits):
        if h and start is None:
            start = x
        elif not h and start is not None:
            ranges.append([start, x - 1])
            start = None
    if start is not None:
        ranges.append([start, w - 1])
    merged = []
    for r in ranges:
        if merged and r[0] - merged[-1][1] <= 3:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [tuple(r) for r in merged if r[1] - r[0] >= 4]


def measure():
    cols = {}
    for k, p in PATHS.items():
        img = Image.open(p).convert("RGBA")
        y = SCAN_ROWS[k]
        cols[k] = find_pipe_cols(img, y)
        print(f"  {k}.png (scan y={y}): {cols[k]}")
    print()

    if len(cols["mid"]) != 2:
        print(f"ERROR: expected 2 pipe columns in mid, got {len(cols['mid'])}")
        return None
    mL, mR = cols["mid"]
    print(f"Reference (mid): left x={mL[0]}..{mL[1]} (w={mL[1]-mL[0]+1}), "
          f"right x={mR[0]}..{mR[1]} (w={mR[1]-mR[0]+1})")

    deltas = {}
    for k in ("top", "bot"):
        if len(cols[k]) != 2:
            print(f"  {k}: expected 2 columns, got {len(cols[k])} — skipping")
            continue
        L, R = cols[k]
        dL = L[0] - mL[0]
        dR = R[0] - mR[0]
        print(f"  {k}: left dx={dL:+d} (width {L[1]-L[0]+1} vs {mL[1]-mL[0]+1}), "
              f"right dx={dR:+d} (width {R[1]-R[0]+1} vs {mR[1]-mR[0]+1})")
        deltas[k] = (dL, dR)
    return deltas


def apply_shifts(deltas):
    """Shift each half of top/bot horizontally to match mid's pipe x-positions.

    Splits each image at x=W/2. Left half moves by -dL, right half by -dR.
    Preserves outer brick patterns (they move along with their pipe).
    """
    for k in ("top", "bot"):
        if k not in deltas:
            continue
        dL, dR = deltas[k]
        if dL == 0 and dR == 0:
            print(f"  {k}.png: already aligned — no change")
            continue
        src_path = PATHS[k]
        bak_path = src_path.with_suffix(src_path.suffix + ".bak")
        if not bak_path.exists():
            shutil.copy2(src_path, bak_path)
            print(f"  {k}.png: backup -> {bak_path.name}")
        else:
            print(f"  {k}.png: backup already exists at {bak_path.name}")

        src = Image.open(src_path).convert("RGBA")
        W, H = src.size
        mid_x = W // 2
        dst = Image.new("RGBA", src.size, (0, 0, 0, 0))
        left_half = src.crop((0, 0, mid_x, H))
        right_half = src.crop((mid_x, 0, W, H))
        dst.paste(left_half, (-dL, 0), left_half)
        dst.paste(right_half, (mid_x - dR, 0), right_half)
        dst.save(src_path)
        print(f"  {k}.png: shifted (left dx={-dL:+d}, right dx={-dR:+d}) and saved")


def revert():
    for k in ("top", "bot"):
        src_path = PATHS[k]
        bak_path = src_path.with_suffix(src_path.suffix + ".bak")
        if bak_path.exists():
            shutil.copy2(bak_path, src_path)
            print(f"  {k}.png: restored from {bak_path.name}")
        else:
            print(f"  {k}.png: no backup found at {bak_path.name}")


def lock():
    for k in ("top", "bot"):
        bak_path = PATHS[k].with_suffix(PATHS[k].suffix + ".bak")
        if bak_path.exists():
            bak_path.unlink()
            print(f"  {k}.png: deleted {bak_path.name} (locked)")
        else:
            print(f"  {k}.png: no backup to delete")


def main():
    mode = "measure"
    if "--apply" in sys.argv:
        mode = "apply"
    elif "--revert" in sys.argv:
        mode = "revert"
    elif "--lock" in sys.argv:
        mode = "lock"

    print(f"L2 pipe alignment — mode: {mode}\n")

    if mode == "revert":
        revert()
        return 0
    if mode == "lock":
        lock()
        return 0

    print("Measuring pipe column x-ranges (reference = mid.png):")
    deltas = measure()
    if deltas is None:
        return 1
    if mode == "apply":
        print("\nApplying shifts to top.png and bot.png:")
        apply_shifts(deltas)
        print("\nDone. Test in-game. If good: --lock. If bad: --revert.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
