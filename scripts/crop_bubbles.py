"""
Crop the 5 pixel-art speech bubbles out of thought-bubbles.png into
8 isolated RGBA PNGs (some shapes are reused across keys).

Pipeline:
  1. Load sheet.
  2. Convert near-white background to transparent (corner flood-fill, tol=10).
  3. Run 4-connectivity blob scan over alpha > 0.
  4. Keep blobs with area > 400 px (filters away stray pixels).
  5. Sort row-major (top->bottom, left->right), grouping rows whose y-ranges overlap.
  6. Crop each blob with 2 px transparent padding.
  7. Write 8 output PNGs per the mapping below.

Run once after placing the source sheet. Output goes to
PixelArt/thought_bubbles/dialogues/.
"""

import pathlib
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not installed. Run:  py -3 -m pip install pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "PixelArt/thought_bubbles/thought_bubbles_v1/thought-bubbles.png"
OUT = ROOT / "PixelArt/thought_bubbles/dialogues"
OUT.mkdir(parents=True, exist_ok=True)

# Mapping: output filename -> index into sorted-blob list.
# Blob order after row-major sort:
#   0 row1-left   (l1_outro shape, shorter rounded rect)
#   1 row1-right  (intro shape, wider rounded rect)
#   2 row2-left   (unused)
#   3 row2-right  (l2_outro shape, largest rounded rect)
#   4 row3        (burst)
MAPPING = {
    "l1_intro.png":    1,
    "l2_intro.png":    1,
    "l3_intro.png":    1,
    "l1_outro.png":    0,
    "l2_outro.png":    3,
    "l3_outro.png":    4,
    "life_hazard.png": 4,
    "life_wasp.png":   4,
}

PAD = 2
WHITE_TOL = 10


def corner_flood_to_transparent(img):
    """Flood-fill from each corner: near-white -> alpha 0."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    stack = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    seen = [[False] * h for _ in range(w)]
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            continue
        r, g, b, a = px[x, y]
        if a == 0 or (r >= 255 - WHITE_TOL and g >= 255 - WHITE_TOL and b >= 255 - WHITE_TOL):
            seen[x][y] = True
            px[x, y] = (0, 0, 0, 0)
            stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return img


def find_blobs(img, min_area=400):
    w, h = img.size
    px = img.load()
    visited = [[False] * h for _ in range(w)]
    blobs = []
    for y0 in range(h):
        for x0 in range(w):
            if visited[x0][y0] or px[x0, y0][3] == 0:
                continue
            stack = [(x0, y0)]
            minx, miny, maxx, maxy, count = x0, y0, x0, y0, 0
            while stack:
                x, y = stack.pop()
                if x < 0 or y < 0 or x >= w or y >= h or visited[x][y] or px[x, y][3] == 0:
                    continue
                visited[x][y] = True
                count += 1
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
                stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
            if count >= min_area:
                blobs.append((minx, miny, maxx + 1, maxy + 1, count))
    return blobs


def sort_row_major(blobs):
    """Group by overlapping y-ranges, then sort within each row by x."""
    remaining = list(blobs)
    remaining.sort(key=lambda b: b[1])
    rows = []
    while remaining:
        seed = remaining.pop(0)
        row = [seed]
        seed_mid_y = (seed[1] + seed[3]) / 2
        tol = (seed[3] - seed[1]) * 0.5
        keep = []
        for b in remaining:
            mid = (b[1] + b[3]) / 2
            if abs(mid - seed_mid_y) <= tol:
                row.append(b)
            else:
                keep.append(b)
        remaining = keep
        row.sort(key=lambda b: b[0])
        rows.append(row)
    flat = []
    for row in rows:
        flat.extend(row)
    return flat


def crop_with_pad(img, box):
    x0, y0, x1, y1, _ = box
    W, H = img.size
    out_w = (x1 - x0) + 2 * PAD
    out_h = (y1 - y0) + 2 * PAD
    canvas = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    src = img.crop((x0, y0, x1, y1))
    canvas.paste(src, (PAD, PAD))
    return canvas


def main():
    if not SRC.exists():
        sys.exit(f"Source sheet missing: {SRC}")
    sheet = corner_flood_to_transparent(Image.open(SRC))
    blobs = find_blobs(sheet)
    blobs = sort_row_major(blobs)
    print(f"Found {len(blobs)} blobs (expected 5):")
    for i, b in enumerate(blobs):
        print(f"  [{i}] bbox=({b[0]},{b[1]},{b[2]},{b[3]})  size={b[2]-b[0]}x{b[3]-b[1]}  px={b[4]}")

    if len(blobs) < 5:
        sys.exit("Fewer than 5 blobs detected — adjust WHITE_TOL or min_area.")

    for filename, idx in MAPPING.items():
        if idx >= len(blobs):
            print(f"  SKIP {filename}: index {idx} out of range")
            continue
        out = crop_with_pad(sheet, blobs[idx])
        path = OUT / filename
        out.save(path, "PNG")
        print(f"  wrote {filename}  {out.size[0]}x{out.size[1]}")
    print(f"Output folder: {OUT}")


if __name__ == "__main__":
    main()
