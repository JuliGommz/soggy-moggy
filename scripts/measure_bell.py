"""Measure bell-trigger sprites for L2 outro.

Run: python scripts/measure_bell.py

Reads:
  PixelArt/backgrounds/level_2_shaft/outro_trigger/bell_stand.png
  PixelArt/backgrounds/level_2_shaft/outro_trigger/bell_spritesheet.png

Prints:
  - dimensions of both sheets
  - ring-center in bell_stand (auto-detected via interior transparent hole)
  - per-frame rope-top in bell_spritesheet (topmost opaque pixel of each frame)
  - JS-ready constants block
Writes:
  bell_stand_measured.png       — 8x upscale + grid overlay + ring marker
  bell_spritesheet_measured.png — 8x upscale + grid overlay + per-frame rope markers

Anchors as the rope physically aligns with the stand's hook ring:
  draw stand at world pos (sx, sy)  →  ring world pos = (sx + RING_X, sy + RING_Y)
  draw bell frame so its ROPE_TOP overlaps the ring world pos
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT  = Path(__file__).resolve().parent.parent
STAND = ROOT / "PixelArt" / "backgrounds" / "level_2_shaft" / "outro_trigger" / "bell_stand.png"
SHEET = ROOT / "PixelArt" / "backgrounds" / "level_2_shaft" / "outro_trigger" / "bell_spritesheet.png"

ALPHA_THRESHOLD = 8     # treat alpha <= this as transparent
UPSCALE         = 8     # overlay zoom factor
GRID_STEP       = 5     # grid line every N source pixels


def opaque_mask(img):
    """Return list of lists: True if pixel at (x,y) is opaque."""
    w, h = img.size
    px   = img.load()
    return [[px[x, y][3] > ALPHA_THRESHOLD for x in range(w)] for y in range(h)]


def bbox_of(mask, predicate):
    """Bounding box (x0, y0, x1, y1) of pixels where predicate(mask[y][x]) is True. None if empty."""
    h = len(mask)
    w = len(mask[0]) if h else 0
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if predicate(mask[y][x]):
                xs.append(x); ys.append(y)
    if not xs:
        return None
    return (min(xs), min(ys), max(xs), max(ys))


def find_interior_holes(mask):
    """Find transparent pixels that are surrounded by opaque pixels in all 4 cardinal directions
    (within the image bounds). Returns bbox (x0,y0,x1,y1) of the largest such region, or None."""
    h = len(mask)
    w = len(mask[0]) if h else 0
    interior = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                continue
            up    = any(mask[yy][x] for yy in range(0, y))
            down  = any(mask[yy][x] for yy in range(y + 1, h))
            left  = any(mask[y][xx] for xx in range(0, x))
            right = any(mask[y][xx] for xx in range(x + 1, w))
            if up and down and left and right:
                interior[y][x] = True
    return bbox_of(interior, lambda v: v)


def detect_frame_columns(mask):
    """Detect vertical gaps (fully-transparent columns) splitting the sheet into frames.
    Returns list of (x0, x1) inclusive ranges, one per frame.
    Falls back to 3 equal-width frames if no gaps are present."""
    h = len(mask)
    w = len(mask[0]) if h else 0
    col_opaque = [any(mask[y][x] for y in range(h)) for x in range(w)]
    frames = []
    x = 0
    while x < w:
        while x < w and not col_opaque[x]:
            x += 1
        if x >= w:
            break
        x0 = x
        while x < w and col_opaque[x]:
            x += 1
        frames.append((x0, x - 1))
    if len(frames) != 3:
        # fallback: assume 3 equal-width frames spanning full width
        fw = w // 3
        frames = [(i * fw, (i + 1) * fw - 1) for i in range(3)]
        frames[-1] = (frames[-1][0], w - 1)
    return frames


def topmost_opaque(mask, x0, x1):
    """Return (x, y) of topmost opaque pixel in column range [x0, x1]. None if column band is empty."""
    h = len(mask)
    for y in range(h):
        for x in range(x0, x1 + 1):
            if mask[y][x]:
                return (x, y)
    return None


def render_overlay(img, markers, out_path):
    """Save img upscaled UPSCALE× with a coordinate grid every GRID_STEP src px,
    plus colored circles at each (x, y, label, color) marker (in source-px coords)."""
    w, h = img.size
    big  = img.resize((w * UPSCALE, h * UPSCALE), Image.NEAREST).convert("RGBA")
    draw = ImageDraw.Draw(big)
    for x in range(0, w + 1, GRID_STEP):
        draw.line([(x * UPSCALE, 0), (x * UPSCALE, h * UPSCALE)], fill=(255, 0, 255, 80), width=1)
    for y in range(0, h + 1, GRID_STEP):
        draw.line([(0, y * UPSCALE), (w * UPSCALE, y * UPSCALE)], fill=(255, 0, 255, 80), width=1)
    for (mx, my, label, color) in markers:
        cx, cy = mx * UPSCALE + UPSCALE // 2, my * UPSCALE + UPSCALE // 2
        r = UPSCALE
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)
        draw.text((cx + r + 2, cy - r), label, fill=color)
    big.save(out_path)


def measure_stand():
    img  = Image.open(STAND).convert("RGBA")
    w, h = img.size
    mask = opaque_mask(img)
    print(f"=== bell_stand.png  ({w} x {h}) ===")

    body = bbox_of(mask, lambda v: v)
    print(f"  body bbox      = {body}")

    hole = find_interior_holes(mask)
    if hole:
        cx = (hole[0] + hole[2]) // 2
        cy = (hole[1] + hole[3]) // 2
        print(f"  ring (hole)    = bbox {hole}  ->  center = ({cx}, {cy})")
    else:
        cx = cy = None
        print(f"  ring (hole)    = NOT DETECTED — measure manually in Pixelorama")

    markers = []
    if cx is not None:
        markers.append((cx, cy, f"ring ({cx},{cy})", (0, 200, 255, 255)))
    render_overlay(img, markers, STAND.parent / "bell_stand_measured.png")
    return (w, h, cx, cy)


def measure_sheet():
    img  = Image.open(SHEET).convert("RGBA")
    w, h = img.size
    mask = opaque_mask(img)
    print(f"\n=== bell_spritesheet.png  ({w} x {h}) ===")

    frames = detect_frame_columns(mask)
    print(f"  detected {len(frames)} frames at columns: {frames}")

    rope_tops = []
    markers   = []
    colors    = [(255, 80, 80, 255), (80, 255, 80, 255), (80, 180, 255, 255)]
    labels    = ["left", "mid", "right"]
    for i, (x0, x1) in enumerate(frames):
        top = topmost_opaque(mask, x0, x1)
        if top is None:
            print(f"  frame {i} ({labels[i]}): empty")
            rope_tops.append(None)
            continue
        local_x = top[0] - x0
        local_y = top[1]
        rope_tops.append((top[0], top[1], local_x, local_y, x1 - x0 + 1))
        print(f"  frame {i} ({labels[i]}): cols {x0}-{x1}  width {x1-x0+1}  rope-top sheet=({top[0]},{top[1]})  local=({local_x},{local_y})")
        markers.append((top[0], top[1], f"{labels[i]} top ({local_x},{local_y})", colors[i]))

    render_overlay(img, markers, SHEET.parent / "bell_spritesheet_measured.png")
    return (w, h, frames, rope_tops)


def main():
    sw, sh, ring_x, ring_y = measure_stand()
    bw, bh, frames, tops   = measure_sheet()

    print("\n=== Suggested JS constants ===")
    print(f"const _BELL_STAND_W     = {sw};")
    print(f"const _BELL_STAND_H     = {sh};")
    if ring_x is not None:
        print(f"const _BELL_STAND_RING_X = {ring_x};   // ring center x within stand")
        print(f"const _BELL_STAND_RING_Y = {ring_y};   // ring center y within stand")
    print(f"const _BELL_SHEET_W     = {bw};")
    print(f"const _BELL_SHEET_H     = {bh};")
    if len(frames) == 3 and all(t is not None for t in tops):
        widths = [x1 - x0 + 1 for (x0, x1) in frames]
        if len(set(widths)) == 1:
            print(f"const _BELL_FRAME_W      = {widths[0]};   // uniform frame width")
        else:
            print(f"// frame widths differ: {widths}")
        # Frame source rects
        print("const _BELL_FRAMES = [")
        for i, ((x0, x1), top) in enumerate(zip(frames, tops)):
            local_x, local_y = top[2], top[3]
            print(f"  {{ sx: {x0}, sw: {x1-x0+1}, ropeTopX: {local_x}, ropeTopY: {local_y} }}, // {['left','mid','right'][i]}")
        print("];")
        # Asymmetry check
        mid_local = tops[1][2]
        deltas = [tops[i][2] - mid_local for i in (0, 2)]
        if deltas[0] != 0 or deltas[1] != 0:
            print(f"// rope-top X differs from mid by  left={deltas[0]:+d}  right={deltas[1]:+d}")
            print("// → use per-frame anchors (already encoded above)")
        else:
            print("// rope-top X is identical across frames — single anchor suffices")

    print("\nMeasured overlays written to:")
    print(f"  {STAND.parent / 'bell_stand_measured.png'}")
    print(f"  {SHEET.parent / 'bell_spritesheet_measured.png'}")


if __name__ == "__main__":
    main()
