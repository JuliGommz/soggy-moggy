"""Measure cloud bounding boxes in PixelArt/platforms/level_3_sea/clouds_spritesheet.png.

Run: python scripts/measure_clouds.py
Output: prints 6 entries (sx, sy, sw, sh, landingY) for the cloud variants dict.

landingY = sprite-local Y where the "landing line" for the cat sits.
Heuristic: topmost opaque row of each cloud + 45% of that cloud's total height.
Tweak by hand afterwards if a specific cloud needs the cat higher or lower.
"""
from PIL import Image
from pathlib import Path

ATLAS = Path(__file__).resolve().parent.parent / "PixelArt" / "platforms" / "level_3_sea" / "clouds_spritesheet.png"

def main():
    img = Image.open(ATLAS).convert("RGBA")
    w, h = img.size
    px = img.load()
    print(f"# atlas: {ATLAS.name}  size = {w} x {h}")

    opaque_rows = []
    for y in range(h):
        has_pixel = any(px[x, y][3] > 8 for x in range(w))
        opaque_rows.append(has_pixel)

    bands = []
    y = 0
    while y < h:
        if opaque_rows[y]:
            y0 = y
            while y < h and opaque_rows[y]:
                y += 1
            bands.append((y0, y - 1))
        else:
            y += 1

    print(f"# detected {len(bands)} vertical bands (expected 6)")

    for i, (y0, y1) in enumerate(bands):
        x_min, x_max = w, -1
        for yy in range(y0, y1 + 1):
            for x in range(w):
                if px[x, yy][3] > 8:
                    if x < x_min:
                        x_min = x
                    if x > x_max:
                        x_max = x
        sw = x_max - x_min + 1
        sh = y1 - y0 + 1
        landing_y = int(sh * 0.45)
        print(
            f"  {{ sx: {x_min:3d}, sy: {y0:3d}, sw: {sw:3d}, sh: {sh:3d}, landingY: {landing_y:3d} }}, "
            f"// cloud #{i + 1}"
        )

if __name__ == "__main__":
    main()
