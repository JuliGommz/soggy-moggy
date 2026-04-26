# Visuals Asset Naming Convention
**Project:** Soggy Moggy
**Last updated:** 25.03.2026

---

## Core Rule

**All lowercase `snake_case` — for folders AND files, no exceptions.**

- No uppercase letters anywhere
- No hyphens (use `_` as the only separator)
- No spaces
- Typos get fixed immediately, not accumulated

This ensures the asset paths work identically on Windows (local dev) and Linux (GitHub Pages server), which is case-sensitive.

---

## Folder Structure

```
Visuals/
├── characters/
│   ├── cat/                Player character sprites
│   └── wasp/               Wasp enemy sprites
├── backgrounds/
│   ├── shared/             Shared across all levels (sky, clouds, stars)
│   ├── level1_city/        Level 1 — La Ciudad
│   ├── level_2_shaft/      Level 2 — El Pozo Eléctrico (Aufzugschacht)
│   └── level_3_sea/        Level 3 — El Mar Abierto (Leuchtturm/See)
├── platforms/
│   ├── level1_city/        Level 1 platform sprite sheets
│   └── level_2_lift/       Level 2 shaft jump-platform sheet
├── collectibles/           Spawnbare In-Game-Pickups (balloon)
├── ui/
│   └── hud/                HUD-Elemente (Herzen)
├── thought_bubbles/        Dialogue-Bubble-Assets
├── fonts/                  Bitmap-Fonts + Illustrator-Quelldateien
├── _archive/               Archivierte Assets (siehe README darin)
├── _wip/                   Work in progress — NOT subject to this convention
└── _dev/                   Dev tools, inspiration, archive — NOT subject to this convention
```

**Rule:** Level folders are named `level_N_theme` (e.g., `level_2_shaft`, `level_3_sea`). Level 1 uses the legacy form `level1_city` for historical consistency. New levels follow the `level_N_theme` pattern.

**Rule:** `_` prefix = excluded from game-content convention. These folders are for internal dev use only.

---

## File Naming

### Pattern

```
[element]_[variant/position].ext
```

The **folder provides context** — never repeat the folder name inside the filename.

| Do | Do Not |
|---|---|
| `level_2_shaft/shaft_bg_bottom.png` | `level_2_shaft/elevator_shaft_background_bottom.png` |
| `collectibles/balloon.png` | `collectibles/extra-life-balloon.png` |
| `level1_city/building_roof.png` | `level1_city/Building_Roof.png` |

### Suffixes (when needed)

| Suffix | Meaning |
|---|---|
| `_sheet` | Sprite sheet with multiple rows or columns |
| `_icon` | Small UI / HUD element |
| `_tile` | Designed to be tiled/repeated vertically or horizontally |
| `_bottom` / `_mid` / `_top` | Position in a vertical stack |
| `_01` `_02` | Numbered sequence (zero-padded when 10+ frames expected) |

### Animation frames

Use state names directly: `idle.png`, `rise.png`, `peak.png`. For walk cycles with 2 frames: `walk_1.png`, `walk_2.png`.

---

## Source File Rule

Every `.pxo` source file shares the **exact same base name** as its exported `.png`. If you export `shaft_bg_bottom.png`, the Pixelorama source is `shaft_bg_bottom.pxo`.

---

## Current Game Assets

### `characters/cat/`
```
animation_sheet.png     — sheet: 7 sprites (all animation poses)
einzel_sprites/         — individual source PNGs (reference, not loaded by game)
```

### `characters/wasp/`
```
wasp_sheet.png          — sheet: 4 frames (252x44, 4x 63x44)
einzel_sprites/         — individual frame PNGs (reference, not loaded by game)
```

### `backgrounds/shared/`
```
sky_day.png / sky_night.png
clouds_bright.png / clouds_dark.png / stars.png
```

### `backgrounds/level1_city/`
```
building_wall.png       — repeating wall tile
windows.png             — 2x2 sheet: clean A/B, dirty A/B
cornice.png             — decorative horizontal band
building_door.png       — entrance element
trash_bin.png           — sidewalk decoration
entrance_garbage.png    — entrance area decoration
building_roof.png       — rooftop at level goal
```

### `backgrounds/level_3_sea/`
```
sun.png                 — sun sprite with pulse animation
lighthouse_sheet.png    — sheet: 9 sprites (base, mid_1–mid_7, top cap)
sea_launchpad.png       — shoreline background
```

### `backgrounds/level_2_shaft/`
```
elevator.png            — elevator interior (world bottom)
shaft_bg_bottom.png     — shaft bottom section
shaft_bg_mid1.png       — shaft mid section variant 1
shaft_bg_mid2.png       — shaft mid section variant 2 (alternate tile)
shaft_bg_top.png        — shaft top + golden bar + hatch
pipes_bottom.png        — mid-layer pipes (bg-mid, bottom segment)
pipes_mid.png           — mid-layer pipes (bg-mid, repeating)
pipes_top.png           — mid-layer pipes (bg-mid, top segment)
```

### `platforms/level1_city/`
```
jalousie_sheet.png      — sprite sheet: 7 rows (intact variants 1-3/5-6, cracked row 4)
jalousie_parts.png      — individual parts reference
```

### `platforms/level_2_lift/`
```
jump_plattforms.png     — sheet: 9 variants (L/C/R × L/M/S size tiers), 480x258
```

### `collectibles/`
```
balloon.png             — floating cat+balloon extra life collectible (in-game pickup)
```

### `ui/hud/`
```
life_icon.png           — HUD life counter icon (small, top-right)
life_plush.png          — larger plush variant (reference/preview, not loaded by game)
```

---

## Adding New Assets

1. Determine the correct folder from the structure above.
2. Choose a name following the pattern: `element_variant.ext` — all lowercase snake_case.
3. Create the `.pxo` source with the same base name.
4. Export the `.png` with the same base name.
5. Add the path to the relevant `src/` file — never use uppercase or hyphens in the path string.

---

## Produktionswerkzeuge

Alle Sprites wurden manuell mit **Pixelorama** gezeichnet (Open-Source-Pixelart-Editor).
Weitere Informationen und Download: https://pixelorama.org/
Quelldateien: `.pxo`

Einzelne Sprites wurden mit **Adobe Photoshop** zusammengesetzt (z.B. Spritesheets aus Einzelteilen).
Erkennbar an: `.psd`

Welche Datei mit welchem Tool erstellt wurde, wird im Medienkatalog am Projektende vollständig dokumentiert.
