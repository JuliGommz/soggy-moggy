# Medienkatalog — Soggy Moggy / Gato Sin Botas

**Verfasser:** Julian Gomez
**Stand:** 21.04.2026
**Zweck:** Vollständiger Nachweis aller im Spiel verwendeten Medien, ihrer Herkunft und Lizenz. Dieses Dokument ist Teil der Abgabe und dient als **Anlage A (Medienverzeichnis)** der Abschlussarbeit.

Alle Pfade sind relativ zur Projekt-Wurzel `Abschlussprojekt_SRH_26/`. Verifiziert gegen den Dateisystem-Stand am 21.04.2026 und gegen die `*.src = '...'`-Zuweisungen im Quellcode (`src/*.js`).

Herkunftsbegriffe:
- **Eigenproduktion (Pixelorama)** — manuell gezeichnet von Julian Gomez in Pixelorama, Quelldatei `.pxo` liegt neben dem PNG.
- **Eigenproduktion (Photoshop)** — aus Einzelteilen in Adobe Photoshop zusammengesetzt, Quelldatei `.psd`.
- **Eigenproduktion (Illustrator)** — aus Vektor-Artboards in Adobe Illustrator exportiert, Quelldatei `.ai`.
- **Vecteezy.com** — Free-License-Asset von vecteezy.com, Attribution erforderlich.

Lizenzbegriffe:
- **Eigenrechte** — Julian Gomez hält alle Rechte, freie Nutzung im Schulkontext.
- **Vecteezy Free License** — Nutzung erlaubt mit Attribution „Fonts: Vecteezy.com".

---

## 1. Hintergründe — Shared

Parallax-Ebenen, in jedem Level geladen.

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Background shared | `PixelArt/backgrounds/shared/sky_day.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (alle Level) |
| Background shared | `PixelArt/backgrounds/shared/sky_night.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` |
| Background shared | `PixelArt/backgrounds/shared/stars.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` |
| Background shared | `PixelArt/backgrounds/shared/clouds_bright.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` |
| Background shared | `PixelArt/backgrounds/shared/clouds_dark.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` |

## 2. Hintergründe — Level 1 La Ciudad

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Background L1 | `PixelArt/backgrounds/level1_city/building_wall.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/windows.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/platforms.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/entrance_garbage.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/building_door.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/trash_bin.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/cornice.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L1) |
| Background L1 | `PixelArt/backgrounds/level1_city/building_roof.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L1) |

## 3. Hintergründe — Level 2 El Pozo Eléctrico

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Background L2 | `PixelArt/backgrounds/level_2_shaft/elevator.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/shaft_bg_bottom.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/shaft_bg_mid1.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/shaft_bg_mid2.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/shaft_bg_top.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/pipes_bottom.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (geladen, aktuell nicht gerendert — siehe MEMORY.md) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/pipes_mid.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L2) |
| Background L2 | `PixelArt/backgrounds/level_2_shaft/pipes_top.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L2) |

## 4. Hintergründe — Level 3 El Mar Abierto

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Background L3 | `PixelArt/backgrounds/level_3_sea/sun.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | `src/background.js` (L3) |
| Background L3 | `PixelArt/backgrounds/level_3_sea/lighthouse_sheet.png` | PNG | Eigenproduktion (Photoshop, aus `EInzel-Sprites/lh_00…lh_08.png`) | Eigenrechte | `src/background.js` (L3) |

## 5. Charaktere

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Charakter Katze | `PixelArt/characters/cat/animation_sheet.png` | PNG | Eigenproduktion (Photoshop, aus `einzel_sprites/*.png`) | Eigenrechte | `src/player.js` |
| Charakter Wespe | `PixelArt/characters/wasp/wasp_sheet.png` | PNG (252×44, 4 Frames à 63×44) | Eigenproduktion (Pixelorama + Photoshop) | Eigenrechte | `src/enemies.js` |

> Hinweis: Die Einzel-Sprites der Katze (`einzel_sprites/idle.png`, `rise.png`, `peak.png`, `push_rise.png`, `push_peak.png`, `walk_1.png`, `walk_2.png`) sowie der Wespe (`einzel_sprites/wasp_body*.png`) liegen als Arbeitsmaterial im Repo, werden aber zur Laufzeit nicht geladen. `docs/ASSET_LIST.md` verweist an einigen Stellen noch auf die alten Einzel-PNGs; aktiv geladen wird seit Phase 4 nur das jeweilige Sheet. (TODO: ASSET_LIST.md angleichen.)

## 6. Plattformen

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Plattform L1 | `PixelArt/platforms/level1_city/jalousie_sheet.png` | PNG (7-Zeilen-Sheet) | Eigenproduktion (Pixelorama) | Eigenrechte | `src/platforms.js` (L1) |
| Plattform L1 (Referenz) | `PixelArt/platforms/level1_city/jalousie_parts.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | nicht im Code, Arbeitsmaterial |
| Plattform L2 | `PixelArt/platforms/level_2_lift/jump_plattforms.png` | PNG (480×258, 9 Varianten) | Eigenproduktion (Pixelorama) | Eigenrechte | `src/platforms.js` (L2) |
| Plattform L3 | — | (canvas-drawn) | Im Code gezeichnet | — | `src/platforms.js` (L3-Zweig) |

## 7. Kollektible

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Ballon (Zusatzleben) | `PixelArt/collectibles/balloon.png` | PNG (150×220 Quelle, 70×106 gezeichnet) | Eigenproduktion (Pixelorama) | Eigenrechte | `src/main.js` |

## 8. UI / HUD

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| HUD Leben-Icon | `PixelArt/ui/hud/life_icon.png` | PNG (20×16 pro Leben) | Eigenproduktion (Pixelorama) | Eigenrechte | `src/main.js` (HUD + Game-Over) |
| HUD Plüschkatze (Referenz) | `PixelArt/ui/hud/life_plush.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | nicht im Code, Arbeitsmaterial für Balloon-Subzone |

## 9. Fonts

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Bitmap-Font (Titel) | `PixelArt/fonts/alphabet_pixel_retro_video_game_style.png` | PNG | Vecteezy.com (Bearbeitung in Illustrator) | Vecteezy Free License (Attribution) | historisch `src/font.js`; seit Dialog-PNG-Redesign nicht mehr aktiv geladen |
| Bitmap-Font (Body schwarz) | `PixelArt/fonts/alphabet_black_230px.png` | PNG | Vecteezy.com (Bearbeitung in Illustrator) | Vecteezy Free License (Attribution) | historisch `src/font.js`; seit Dialog-PNG-Redesign nicht mehr aktiv geladen |
| Font-Archiv | `PixelArt/fonts/Archive/alphabet.png` | PNG | Vecteezy.com | Vecteezy Free License | nicht mehr verwendet |
| Font-Archiv | `PixelArt/fonts/Archive/Letter_alphabet_pixel_retro_video_game_style.png` | PNG | Vecteezy.com | Vecteezy Free License | nicht mehr verwendet |
| Font-Archiv | `PixelArt/fonts/Archive/alphabet_pixel_retro_video_game_style_576px.png` | PNG | Vecteezy.com | Vecteezy Free License | nicht mehr verwendet |
| Font-Archiv | `PixelArt/fonts/Archive/alphabet_black_576px.png` | PNG | Vecteezy.com | Vecteezy Free License | nicht mehr verwendet |

**Attribution-Pflicht:** „Fonts: Vecteezy.com" — wird in den Credits des Spiels, in dieser Datei und in der README ausgewiesen.

## 10. Dialog-Bubbles

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Dialog-Vektor-Quelle | `PixelArt/thought_bubbles/dialogue_bubbles.ai` | AI | Eigenproduktion (Illustrator) | Eigenrechte | Quelldatei für die 8 Dialog-PNGs |
| Dialog PNG 1 | `PixelArt/thought_bubbles/dialogues/l1_intro.png` | PNG | Eigenproduktion (Illustrator) | Eigenrechte | TODO: PNG noch nicht exportiert (Stand 21.04.2026), nur `.gitkeep` vorhanden |
| Dialog PNG 2 | `PixelArt/thought_bubbles/dialogues/l2_intro.png` | PNG | Eigenproduktion (Illustrator) | Eigenrechte | TODO: noch nicht exportiert |
| Dialog PNG 3 | `PixelArt/thought_bubbles/dialogues/l3_intro.png` | PNG | Eigenproduktion (Illustrator) | Eigenrechte | TODO: noch nicht exportiert |
| Dialog PNG 4 | `PixelArt/thought_bubbles/dialogues/l1_outro.png` | PNG | Eigenproduktion (Illustrator) | Eigenrechte | TODO: noch nicht exportiert |
| Dialog PNG 5 | `PixelArt/thought_bubbles/dialogues/l2_outro.png` | PNG | Eigenproduktion (Illustrator) | Eigenrechte | TODO: noch nicht exportiert |
| Dialog PNG 6 | `PixelArt/thought_bubbles/dialogues/l3_outro.png` | PNG | Eigenproduktion (Illustrator) | Eigenrechte | TODO: noch nicht exportiert |
| Dialog PNG 7 | `PixelArt/thought_bubbles/dialogues/life_hazard.png` | PNG | Eigenproduktion (Illustrator) | Eigenrechte | TODO: noch nicht exportiert |
| Dialog PNG 8 | `PixelArt/thought_bubbles/dialogues/life_wasp.png` | PNG | Eigenproduktion (Illustrator) | Eigenrechte | TODO: noch nicht exportiert |
| Dialog-Archiv v1 | `PixelArt/_archive/thought_bubbles_v1/thought-bubbles.png` | PNG | Eigenproduktion (Pixelorama) | Eigenrechte | nicht mehr verwendet (frühere Bubble-Version) |

## 11. Audio

| Kategorie | Datei | Format | Herkunft | Lizenz | Verwendet in |
|---|---|---|---|---|---|
| Sound-Effekte, Musik | — | — | — | — | Phase 6 geplant, aktuell keine Audio-Assets im Repo |

---

## Überblick-Statistik (verifiziert 21.04.2026)

- Eigenproduktion Pixelorama: ca. 29 produktive PNGs + entsprechende `.pxo`-Quellen.
- Eigenproduktion Photoshop: 2 zusammengesetzte Sheets (`animation_sheet.png` Katze, `lighthouse_sheet.png`).
- Eigenproduktion Illustrator: 1 Vektor-Quelle (`dialogue_bubbles.ai`) mit 8 geplanten PNG-Exporten.
- Fremdmaterial: Vecteezy-Font-Grundlagen, Attribution in den Credits verpflichtend.

## Offene Punkte

1. 8 Dialog-Bubble-PNGs aus Illustrator exportieren und in `PixelArt/thought_bubbles/dialogues/` ablegen.
2. `docs/ASSET_LIST.md` Abschnitt „Cat Character Sprites" an den tatsächlichen Code-Stand anpassen (nur `animation_sheet.png` wird geladen, nicht die Einzel-PNGs).
3. Audio-Assets folgen in Phase 6.
