# Media Catalogue — Soggy Moggy / Gato Sin Botas

**Author:** Julian Gomez
**Date:** 21.04.2026
**Purpose:** Complete record of all media used in the game, their origin, and their licence. This document is part of the final submission and serves as **Appendix A (Media Index)** of the thesis.

All paths are relative to the project root `Abschlussprojekt_SRH_26/`. Verified against the filesystem state on 21.04.2026 and against the `*.src = '...'` assignments in the source code (`src/*.js`).

Origin terms:
- **Own production (Pixelorama)** — drawn manually by Julian Gomez in Pixelorama; source file `.pxo` is located next to the PNG.
- **Own production (Photoshop)** — assembled from individual parts in Adobe Photoshop; source file `.psd`.
- **Own production (Illustrator)** — exported from vector artboards in Adobe Illustrator; source file `.ai`.
- **Vecteezy.com** — free-licence asset from vecteezy.com, attribution required.

Licence terms:
- **Own rights** — Julian Gomez holds all rights; free use in a school context.
- **Vecteezy Free License** — use permitted with attribution "Fonts: Vecteezy.com".

---

## 1. Backgrounds — Shared

Parallax layers loaded in every level.

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Background shared | `PixelArt/backgrounds/shared/sky_day.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (all levels) |
| Background shared | `PixelArt/backgrounds/shared/sky_night.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` |
| Background shared | `PixelArt/backgrounds/shared/stars.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` |
| Background shared | `PixelArt/backgrounds/shared/clouds_bright.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` |
| Background shared | `PixelArt/backgrounds/shared/clouds_dark.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` |

## 2. Backgrounds — Level 1 La Ciudad

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Background L1 | `PixelArt/backgrounds/level1_city/building_wall.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/windows.png` | PNG | Own production (Pixelorama) | Own rights | `src/platforms.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/entrance_garbage.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/building_door.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/trash_bin.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/cornice.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/building_roof.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L1) |

## 3. Backgrounds — Level 2 El Pozo Eléctrico

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Background L2 | `PixelArt/backgrounds/level_2_shaft/elevator.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/shaft_bg_bottom.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/shaft_bg_mid1.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/shaft_bg_mid2.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/shaft_bg_top.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/pipes_bottom.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (loaded, currently not rendered — see MEMORY.md) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/pipes_mid.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/pipes_top.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L2) |

## 4. Backgrounds — Level 3 El Mar Abierto

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Background L3 | `PixelArt/backgrounds/level_3_sea/sun.png` | PNG | Own production (Pixelorama) | Own rights | `src/background.js` (L3) |
| Background L3 | `PixelArt/backgrounds/level_3_sea/lighthouse_sheet.png` | PNG | Own production (Photoshop, assembled from `EInzel-Sprites/lh_00…lh_08.png`) | Own rights | `src/background.js` (L3) |

## 5. Characters

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Character cat | `PixelArt/characters/cat/animation_sheet.png` | PNG | Own production (Photoshop, assembled from `einzel_sprites/*.png`) | Own rights | `src/player.js` |
| Character wasp | `PixelArt/characters/wasp/wasp_sheet.png` | PNG (252×44, 4 frames at 63×44) | Own production (Pixelorama + Photoshop) | Own rights | `src/enemies.js` |

> Note: The individual sprites for the cat (`einzel_sprites/idle.png`, `rise.png`, `peak.png`, `push_rise.png`, `push_peak.png`, `walk_1.png`, `walk_2.png`) and the wasp (`einzel_sprites/wasp_body*.png`) are kept in the repo as working material but are not loaded at runtime. `docs/ASSET_LIST.md` still references the old individual PNGs in some places; since Phase 4 only the respective sheet is actively loaded. (TODO: align ASSET_LIST.md.)

## 6. Platforms

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Platform L1 | `PixelArt/platforms/level1_city/jalousie_sheet.png` | PNG (7-row sheet) | Own production (Pixelorama) | Own rights | `src/platforms.js` (L1) |
| Platform L1 (reference) | `PixelArt/platforms/level1_city/jalousie_parts.png` | PNG | Own production (Pixelorama) | Own rights | not in code, working material |
| Platform L2 | `PixelArt/platforms/level_2_lift/jump_plattforms.png` | PNG (480×258, 9 variants) | Own production (Pixelorama) | Own rights | `src/platforms.js` (L2) |
| Platform L3 | — | (canvas-drawn) | Drawn in code | — | `src/platforms.js` (L3 branch) |

## 7. Collectibles

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Balloon (extra life) | `PixelArt/collectibles/balloon.png` | PNG (150×220 source, drawn at 70×106) | Own production (Pixelorama) | Own rights | `src/main.js` |

## 8. UI / HUD

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| HUD life icon | `PixelArt/ui/hud/life_icon.png` | PNG (20×16 per life) | Own production (Pixelorama) | Own rights | `src/main.js` (HUD + Game Over) |
| HUD plush cat (reference) | `PixelArt/ui/hud/life_plush.png` | PNG | Own production (Pixelorama) | Own rights | not in code, working material for balloon sub-zone |

## 9. Fonts

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Bitmap font (title) | `PixelArt/fonts/alphabet_pixel_retro_video_game_style.png` | PNG | Vecteezy.com (edited in Illustrator) | Vecteezy Free License (attribution) | Actively loaded — dialogue title text, rendered by `drawYellowText()` in `src/dialogue.js`. Atlas coords inlined in SECTION 1.5. |
| OTF body font | `PixelArt/fonts/BlockCraft.otf` | OTF | **TODO: fill in source + license** | **TODO** | Actively loaded via `@font-face` in `index.html`; dialogue body text, rendered by `drawBodyText()` in `src/dialogue.js`. |
| Bitmap font archive | `PixelArt/fonts/Archive/alphabet_black_230px.png` | PNG | Vecteezy.com (edited in Illustrator) | Vecteezy Free License | Archived 2026-04-22 — initial body-font attempt (7x4 grid) abandoned due to spacing issues; replaced by BlockCraft.otf. |
| Bitmap font archive | `PixelArt/fonts/Archive/alphabet_black.ai` | AI | Vecteezy.com (edited in Illustrator) | Vecteezy Free License | Illustrator source for above; archived alongside PNG. |
| Font archive | `PixelArt/fonts/Archive/alphabet.png` | PNG | Vecteezy.com | Vecteezy Free License | no longer used |
| Font archive | `PixelArt/fonts/Archive/Letter_alphabet_pixel_retro_video_game_style.png` | PNG | Vecteezy.com | Vecteezy Free License | no longer used |
| Font archive | `PixelArt/fonts/Archive/alphabet_pixel_retro_video_game_style_576px.png` | PNG | Vecteezy.com | Vecteezy Free License | no longer used |
| Font archive | `PixelArt/fonts/Archive/alphabet_black_576px.png` | PNG | Vecteezy.com | Vecteezy Free License | no longer used |

**Attribution requirement:** "Fonts: Vecteezy.com + BlockCraft (source TODO)" — listed in the game credits, in this file, and in the README.

## 10. Dialogue Bubbles

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Dialogue vector source | `PixelArt/thought_bubbles/dialogue_bubbles.ai` | AI | Own production (Illustrator) | Own rights | Source file for empty bubble shapes. Text is NO LONGER baked into PNGs (2026-04-22 pivot) — body text now rendered at runtime via BlockCraft.otf, titles via YELLOW_FONT atlas. Open question: export empty bubble shapes as PNGs or use in-code drawn shapes. |
| Dialogue PNG 1-8 | `PixelArt/thought_bubbles/dialogues/*.png` | PNG | Own production (Illustrator) | Own rights | Not exported. Pending decision whether empty bubble SHAPES (no text) will be exported as backgrounds, or in-code drawn shapes used instead. The previous "text baked in PNG" plan is abandoned. |
| Dialogue archive v1 | `PixelArt/_archive/thought_bubbles_v1/thought-bubbles.png` | PNG | Own production (Pixelorama) | Own rights | no longer used (earlier bubble version) |

## 11. Audio

| Category | File | Format | Origin | Licence | Used in |
|---|---|---|---|---|---|
| Sound effects, music | — | — | — | — | Planned for Phase 6; no audio assets in the repo yet |

---

## Summary Statistics (verified 21.04.2026)

- Own production Pixelorama: approx. 29 production PNGs plus corresponding `.pxo` source files.
- Own production Photoshop: 2 assembled sheets (`animation_sheet.png` cat, `lighthouse_sheet.png`).
- Own production Illustrator: 1 vector source (`dialogue_bubbles.ai`) with 8 planned PNG exports.
- Third-party material: Vecteezy font bases; attribution in the credits is mandatory.

## Open Items

1. Export 8 dialogue bubble PNGs from Illustrator and place them in `PixelArt/thought_bubbles/dialogues/`.
2. Update the "Cat Character Sprites" section of `docs/ASSET_LIST.md` to reflect the actual code state (only `animation_sheet.png` is loaded, not the individual PNGs).
3. Audio assets to follow in Phase 6.
