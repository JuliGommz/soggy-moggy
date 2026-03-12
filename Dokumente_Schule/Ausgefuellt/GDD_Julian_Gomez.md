# Game Design Document
## Soggy Moggy — Gato Sin Botas

**Verfasser:** Julian Gomez
**Schule:** SRH Fachschulen, Fachrichtung Game & Multimedia Design (GME-24.01)
**Rahmenthema:** 3 — Casual Webgame „Plush Toy Combat"
**Abgabedatum:** 22.04.2026
**Dokumentversion:** 1.0

---

## Inhaltsverzeichnis

1. [Grobkonzept](#1-grobkonzept)
   - 1.1 Projektübersicht
   - 1.2 Spielidee & Kernaussage
   - 1.3 Zielgruppe
   - 1.4 Einzigartiges Merkmal (USP)
   - 1.5 Plattform & Technologie
   - 1.6 Umfang & Levelstruktur

2. [Feinkonzept](#2-feinkonzept)
   - 2.1 Spielfluss & Zustände
   - 2.2 Steuerung
   - 2.3 Spielerfigur
   - 2.4 Sprung & Bewegungsmechanik
   - 2.5 Wurf-Mechanik
   - 2.6 Plattformen
   - 2.7 Flut-Mechanik
   - 2.8 Leben & Scheitern
   - 2.9 Punkte & Fortschritt
   - 2.10 Kamera & Weltkoordinaten
   - 2.11 Gegner & Gefahren pro Level
   - 2.12 Levelstruktur im Detail

3. [Designkonzept](#3-designkonzept)
   - 3.1 Visueller Stil & Stimmung
   - 3.2 Farbpalette
   - 3.3 Sprite-Design: Spielerfigur
   - 3.4 Hintergrund & Parallax
   - 3.5 Plattform-Design
   - 3.6 UI & HUD
   - 3.7 Animationssystem
   - 3.8 Audio-Konzept
   - 3.9 Typografie

---

## 1. Grobkonzept

### 1.1 Projektübersicht

| Feld | Wert |
|---|---|
| Projekttitel (intern) | Soggy Moggy |
| Spieltitel (im Spiel) | Gato Sin Botas |
| Genre | Casual Vertical Platformer |
| Plattform | Web-Browser (HTML5) |
| Auflösung | 480 × 640 px (Hochformat) |
| Spielsprache | Spanisch (UI, Texte, HUD) |
| Engine | Kein Framework — Vanilla JS + HTML Canvas 2D |
| Ziel-Altersfreigabe | USK 0 |

### 1.2 Spielidee & Kernaussage

Gato Sin Botas ist ein vertikaler Plattformer, in dem der Spieler eine ausgestopfte Katze steuert, die vor einer stetig steigenden Flut nach oben flieht. Im Gegensatz zu klassischen Endlos-Springern (Doodle Jump, etc.) springt die Figur **nicht automatisch**, sondern nur auf aktive Eingabe des Spielers. Das schafft eine direkte, greifbare Kontrolle und macht jede Plattform zu einer bewussten Entscheidung.

Die Atmosphäre vermittelt „cozy danger": Die Spielwelt ist warm und verspielt gestaltet, die Bedrohung durch die Flut baut aber kontinuierlich Spannung auf. Das Spiel ist in vier thematisch unterschiedliche Level gegliedert, die jeweils eigene Plattformtypen und Gefahren einführen.

### 1.3 Zielgruppe

- **Primär:** Casual-Gamer, 12–30 Jahre, Erfahrung mit Plattformern
- **Sekundär:** Kurzzeit-Spieler (Mobile-Mindset), die schnelle, klare Spielsessions bevorzugen
- **Motivation:** Überleben, Highscore verbessern, alle Level abschließen

### 1.4 Einzigartiges Merkmal (USP)

| Merkmal | Beschreibung |
|---|---|
| Manueller Sprung | Keine Automatik — volle Kontrolle über Timing |
| Figur als Kuscheltier | Plüsch-Ästhetik als Kontrast zur Bedrohung |
| Spanischsprachige UI | Stilmittel für Charakter und Wiedererkennbarkeit |
| Levelbasiert (nicht Endlos) | 4 eigenständige Level mit je eigener Gefahr |
| Wurf-Mechanik | Projektile als Werkzeug gegen Hindernisse |

### 1.5 Plattform & Technologie

Das Spiel läuft vollständig im Browser ohne Plug-ins oder Build-Tools.

- **Sprache:** JavaScript (ES2022+), HTML5, CSS (nur Layout)
- **Rendering:** HTML Canvas 2D API (480×640 px, gesetzt via JS-Attribute)
- **Audio:** Web Audio API
- **Physik:** Eigenimplementierung (semi-fixes Zeitschritt-Modell, Delta-Cap 50 ms)
- **Hosting:** GitHub Pages
- **Keine externen Bibliotheken**

### 1.6 Umfang & Levelstruktur

Das Spiel enthält vier vollständige Spiellevel, je mit eigenem visuellen Thema und eigener Kernmechanik:

| Level | Titel | Setting | Besondere Gefahr |
|---|---|---|---|
| 1 | La Ciudad | Stadtgebäude, Jalousien | Hindernisse (TBD) |
| 2 | El Mar Abierto | Offener See, Masten/Stege | Flut steigt schneller |
| 3 | El Pozo Eléctrico | Aufzugschacht | Elektroschocks |
| 4 | El Parque | Freizeitpark, Geisterbahn | Geister |

---

## 2. Feinkonzept

### 2.1 Spielfluss & Zustände

Das Spiel verwendet eine klar definierte Zustandsmaschine mit drei Hauptzuständen:

```
[ Start-Screen ]
       |
    [ENTER / Klick]
       |
  [ Spielend ]  ◄──────────────────┐
       |                           |
  [Tod durch Flut / Absturz]       |
       |                           |
[ Game Over Screen ]               |
       |                           |
  [Neustart] ────────────────────┘
```

**Start-Screen:** Zeigt Spieltitel „Gato Sin Botas", Steuerungshinweise, Start-Aufforderung.
**Spielend:** Alle Spielmechaniken aktiv; HUD sichtbar.
**Game Over:** Highscore-Anzeige, Neustart-Option; Neustart ohne Seitenreload.

### 2.2 Steuerung

| Aktion | Tastatur | Maus |
|---|---|---|
| Bewegen (links/rechts) | A/D oder Pfeiltasten Links/Rechts | — |
| Springen | Leertaste | Linksklick |
| Werfen | Z | Rechtsklick |

Keine Diagonal-Eingabe. Bewegung ist sofort, kein Beschleunigungsmodell.

### 2.3 Spielerfigur

Die Spielerfigur ist eine **ausgestopfte Katze** (Kuscheltier-Ästhetik), keine realistische Katze. Eigenschaften:

- **Hitbox:** 32 × 32 px (Welt-Koordinaten)
- **Darstellungsgröße:** 96 × 96 px (1,5-fache Skalierung der 64-px-Quell-Sprites)
- **Ausrichtung:** Horizontal gespiegelt bei Richtungswechsel (via `ctx.scale(-1,1)`)
- **Ankerpunkt:** Unterkante der Hitbox bündig mit Plattformoberfläche

### 2.4 Sprung & Bewegungsmechanik

**Sprunglogik:**
- Sprung nur möglich wenn `player.onGround === true`
- Sprungauslösung setzt `vy = JUMP_VELOCITY` (negativ, aufwärts)
- `onGround` wird jede Frame durch Kollisionsprüfung gesetzt; kein Coyote-Time-System

**Physik:**
- Schwerkraft: konstant positiver Y-Wert, addiert auf `vy` pro Frame
- Alle Geschwindigkeiten in px/s, skaliert mit `dt / 1000` (semi-fixes Zeitschritt)
- Delta-Cap bei 50 ms verhindert Physik-Explosion bei Tab-Wechsel

**Kollisionsmodell (One-Way AABB):**
Eine Plattform stoppt die Figur nur wenn alle drei Bedingungen gleichzeitig erfüllt sind:
1. Horizontale Überlappung (Hitboxen überschneiden sich auf X-Achse)
2. Spieler war im Vorframe oberhalb der Plattform
3. Spieler bewegt sich nach unten (`vy > 0`)

Bei Landung: `vy = 0`, `onGround = true`.

### 2.5 Wurf-Mechanik

*(Vollimplementierung in Phase 5)*

- Taste Z / Rechtsklick erzeugt ein Projektil
- Projektil fliegt in Blickrichtung des Spielers
- Kollision mit Hindernissen (Level-spezifisch) löst Effekt aus
- Sprite-Wechsel: `push_rise` (am Boden oder kurz nach Sprung) / `push_peak` (in der Luft)
- Maximale Anzahl gleichzeitiger Projektile: TBD (Balancing Phase 5)

### 2.6 Plattformen

**Plattformtypen:**

| Typ | Verhalten | Visuell |
|---|---|---|
| Normal | Stabil, dauerhaft | Levelthema-Sprite (z.B. Jalousie) |
| Brüchig (Crumble) | Beginnt zu bröckeln nach Landung, verschwindet nach kurzer Zeit | Rissig → Rot, dann unsichtbar |

**Generierung:**
- Plattformen werden prozedural generiert (Endlos-Scroll nach oben)
- Mindestabstand und maximaler Abstand begrenzen Sprungreichweite
- Plattformbreite variiert, zusammengesetzt aus: linker Kappe + gekachelter Mitte + rechter Kappe

**Level 1 — Jalousie:**
- Sprite-Sheet mit 7 Zeilen: Zeilen 1/2/3/5/6 = intakt (zufällig zugewiesen), Zeile 4 = gerissen, Zeile 7 = zerbröckelnd

### 2.7 Flut-Mechanik

- Die Flut steigt kontinuierlich von unten auf
- Flutgeschwindigkeit erhöht sich mit Spielfortschritt
- Kontakt mit der Flut = Leben verlieren
- Visuelle Darstellung: Sinuswellen-Animation in WATER-1 (#2a5fa8) mit WATER-2-Wellenkamm
- Die Flut bleibt in Weltkoordinaten; die Kamera folgt dem Spieler nach oben

### 2.8 Leben & Scheitern

- **Start-Leben:** 3 (dargestellt als Herz-Icons im HUD)
- **Verlust eines Lebens:** Kontakt mit Flut ODER Herunterfallen unter den Bildschirmrand
- **Game Over:** Bei 0 Leben
- **Respawn:** Aktuell kein Mid-Level-Respawn (direkter Game Over bei 0 Leben)

### 2.9 Punkte & Fortschritt

- **Score:** Zurückgelegte Höhe (in Weltkoordinaten) über dem Startpunkt
- Wird kontinuierlich berechnet: `score = max(0, spawnY - player.y)`
- HUD zeigt aktuellen Score in Echtzeit (spanisches Label)
- **Highscore:** Lokal im Browser gespeichert (LocalStorage)

### 2.10 Kamera & Weltkoordinaten

- Alle Spielentitäten existieren in **Weltkoordinaten** (nicht Bildschirmkoordinaten)
- Kamera: einmaliges `ctx.translate(0, -cameraY)` vor dem Render aller Weltobjekte
- HUD wird **nach** `ctx.restore()` gezeichnet (immer in Bildschirmkoordinaten)
- Kamera folgt dem Spieler nach oben; Scroll nach unten nur bis zum Ausgangspunkt

### 2.11 Gegner & Gefahren pro Level

| Level | Gefahr | Beschreibung |
|---|---|---|
| 1 (Stadt) | TBD | Noch zu definieren (Balancing-Phase) |
| 2 (Meer) | Schnellere Flut | Flutstieg-Rate erhöht; Plattformen als Mast-Stege |
| 3 (Aufzugschacht) | Elektroschocks | Horizontale Blitze auf fixen Höhen; timed |
| 4 (Freizeitpark) | Geister | Bewegliche Gegner; Ghost-Train bewegt sich auch leicht horizontal |

### 2.12 Levelstruktur im Detail

**Level 1 — La Ciudad (Stadtsetting):**
- Plattformthema: Jalousien an Stadtgebäuden
- Hintergrundferne Schicht: Silhouette von Hochhäusern
- Einstiegslevel, niedrigste Schwierigkeit
- Führt Sprung- und Bewegungsmechanik ein

**Level 2 — El Mar Abierto (Offener See):**
- Plattformthema: Stege die von Masten/Pfählen ausgehen
- Hintergrundferne Schicht: Weite See, Horizont
- Flut steigt schneller als in Level 1

**Level 3 — El Pozo Eléctrico (Aufzugschacht):**
- Plattformthema: Metallroste / Schachtplattformen
- Hintergrundferne Schicht: Betonwände, Kabel
- Elektroschocks als zeitgesteuerte Querhindernisse

**Level 4 — El Parque (Freizeitpark):**
- Plattformthema: Fahrgeschäft-Elementen, Geisterbahn-Wagen
- Hintergrundferne Schicht: Riesenrad, Lichter
- Geister als bewegliche Gegner; teilweise horizontale Bewegung

---

## 3. Designkonzept

### 3.1 Visueller Stil & Stimmung

**Kernstimmung:** „Cozy Danger"

Das Spiel kombiniert warme, plüschige Pixel-Ästhetik mit einer wachsenden Bedrohung. Die Figur und die Welt fühlen sich weich und einladend an. Die aufsteigende Flut erzeugt Spannung, ohne die Atmosphäre in Richtung Horror zu kippen.

**Stilmerkmale:**
- Pixel Art, 64px-Basis für Figur-Sprites
- Keine schwarzen Outlines — Kontrast durch Farbabstufungen
- Satte, gesättigte Farben mit kontrollierter Palette (16 Farben, fest definiert)
- Weiche Formen für Figur und Plattformen; harte Kanten nur für Architektur

**Verbotene Stilmittel:**
- Kein Antialiasing (imageSmoothingEnabled = false durchgehend)
- Keine CSS-Effekte auf dem Canvas
- Keine externen Fonts mit Blur/Shadow

### 3.2 Farbpalette

Die Palette ist auf 16 Farben festgelegt und unveränderlich. Kein Schwarz (#000000) als Outline.

| Code | Hex | Verwendung |
|---|---|---|
| BG-1 | #7eb8c9 | Taghimmel (Hintergrundebene 1) |
| BG-2 | #2e3a5c | Nachthimmel (Hintergrundebene 2) |
| BG-3 | #1a2438 | Tiefer Nachthimmel |
| BG-4 | #c8e8f0 | Heller Himmelstreifen |
| PLAT-1 | #5a7a3a | Plattformgrundfarbe (Grün) |
| PLAT-2 | #3d5228 | Plattformschatten |
| PLAT-3 | #8ab04a | Plattformhighlight |
| WATER-1 | #2a5fa8 | Flut-Hauptfarbe |
| WATER-2 | #4a8fd8 | Flut-Wellenkamm |
| WATER-3 | #1a3f78 | Flut-Tiefe |
| CAT-1 | #b09070 | Katzenkörper (Plüschbeige) |
| CAT-2 | #d4b896 | Katze-Highlight |
| CAT-3 | #7a6050 | Katze-Schatten |
| CAT-4 | #2a2020 | Katzenaugen (Knöpfe) |
| UI-1 | #f5e6c8 | UI-Hintergrund / Textfelder |
| UI-2 | #c87820 | UI-Akzent / Rahmen |

**Kontrast-Regeln:**
- Spielerfigur (CAT-1) muss immer auf BG-1/BG-2 lesbar sein — bestätigt ausreichend
- HUD-Text auf UI-1-Hintergrund: ausreichender Kontrast
- CAT-2 auf BG-2: grenzwertig — nur für kurze Animationsframes akzeptabel

### 3.3 Sprite-Design: Spielerfigur

Die ausgestopfte Katze ist als Plüschtier konzipiert — erkennbar durch Nähte, Knopfaugen und weiche Körperproportionen.

**Anatomie:**
- Körper: CAT-1 (Beige), mit CAT-2 für Highlights, CAT-3 für Schatten
- Augen: Runde schwarze Knöpfe (CAT-4), kein Glanz
- Nähte: dünne CAT-3-Linien
- Proportionen: Kopf ca. 40% der Gesamtgröße (cartoonhaft übergroß)
- Kein Mund (Plüschtier-Stil)

**Sprite-Set (Implementiert):**

| Sprite | Datei | Zustand |
|---|---|---|
| Idle | `PixelArt/cat/idle.png` | Stehend auf Plattform |
| Rise | `PixelArt/cat/rise.png` | Aufstieg nach Sprung |
| Peak | `PixelArt/cat/peak.png` | Höhepunkt / freier Fall |
| Push Rise | `PixelArt/cat/push_rise.png` | Werfen am Boden / tief in der Luft |
| Push Peak | `PixelArt/cat/push_peak.png` | Werfen auf Höhepunkt |
| Walk 1 | `PixelArt/cat/walk_1.png` | Laufzyklus Frame 1 |
| Walk 2 | `PixelArt/cat/walk_2.png` | Laufzyklus Frame 2 |

**Sprite-Auswahl-Logik (Priorität von oben nach unten):**
1. `pushTimer > 0` → push_rise (am Boden oder kurz nach Sprung) / push_peak (hoch oben)
2. `onGround + vx ≠ 0` → walk_1/walk_2 im Wechsel (alle 150 ms)
3. `onGround + vx = 0` → idle
4. Kurz nach Sprung (bounceTimer > 0,20) → idle (erste 40 ms)
5. Aufsteigend (bounceTimer > 0,05) → rise
6. Schnell fallend (vy > 600) → rise (Vorahnungs-Frame)
7. Sonst → peak

**Y-Offsets** (Pixelkorrektur für transparente Randbereiche, 1,5× skaliert):

| Sprite | Offset |
|---|---|
| idle | 6 px |
| walk | 20 px |
| push_rise | 20 px |
| push_peak | 4 px |

### 3.4 Hintergrund & Parallax

Das Hintergrundsystem besteht aus 5 Ebenen mit unterschiedlichen Scrollgeschwindigkeiten (Parallax):

| Ebene | Asset | Parallax-Faktor | Beschreibung |
|---|---|---|---|
| 1 | sky_day.png | 0,30× | Taghimmel (BG-1) |
| 2 | sky_night.png | 0,30× | Nachthimmel (BG-2), crossfade mit Höhe |
| 3 | stars.png | 0,10× | Sterne, erscheinen ab t=0,3 |
| 4 | clouds_bright.png | 0,60× | Helle Wolken, horizontaler Drift 15 px/s |
| 5 | clouds_dark.png | 0,60× | Dunkle Wolken |

**Tag-zu-Nacht-Übergang:**
Der Übergang von Tag- zu Nachtatmosphäre erfolgt graduell anhand der Spielhöhe. Variable `t` (0 = Boden, 1 = Levelziel). Sterne werden sanft eingeblendet ab t=0,3, voll sichtbar ab t=0,7.

**Wolkenbewegung:**
Horizontaler Drift bei 15 px/s (bright) und 4,5 px/s (stars) — kreiert ein lebendiges, atmendendes Bild auch ohne Spielereingabe.

### 3.5 Plattform-Design

**Level 1 — Jalousien (Stadtsetting):**
- Sprite-Sheet: `PixelArt/platforms/level1_city/jalousie_sheet.png`
- 7 Reihen im Sheet: 5 intakte Zustände, 1 gerissen (gelb, Reihe 4), 1 zerbröckelnd (rot, Reihe 7)
- 3-teiliges Rendering: linke Kappe + gekachelte Mitte + rechte Kappe
- Zufällige Zeile pro Plattform bei Generierung (aus Zeilen 1,2,3,5,6)

Weitere Plattform-Designs für Level 2–4 werden in späteren Phasen erstellt.

### 3.6 UI & HUD

**Sprache:** Alle UI-Texte in Spanisch.

**Start-Screen:**
- Titel: „Gato Sin Botas" (groß, zentriert)
- Untertitel / Spielanleitung: kurze Steuerungsübersicht
- Startaufforderung: z.B. „Presiona ESPACIO para jugar"

**HUD (während des Spiels):**
- Oben links: Leben als Herz-Icons
- Oben rechts: Aktueller Score (Höhe)
- Farbe: UI-1 auf transparentem Hintergrund oder einfarbigem Panel

**Game-Over-Screen:**
- Titel: „Fin del Juego" oder „Game Over" (stilisiert)
- Aktueller Score + Highscore
- Neustart-Aufforderung: „Presiona ESPACIO para reiniciar"

**Design-Regeln für UI:**
- Pixel-font oder system-font (Arial) in Pixel-Größen
- Keine halbtransparenten Overlays ohne feste Farbbegrenzung
- Alle UI-Elemente außerhalb der Weltkoordinaten (nach ctx.restore())

### 3.7 Animationssystem

Das Animationssystem ist frame-basiert ohne externe Bibliothek:

- **Laufzyklus:** 2 Frames (walk_1, walk_2), Wechsel alle 150 ms via `performance.now()`
- **Sprite-Wechsel:** Zustandsbasiert, kein Tweening
- **Bounce-Timer:** 240 ms nach Sprung aktiv — verhindert sofortigen Sprite-Wechsel
- **Push-Timer:** Aktiv solange Wurf-Aktion läuft

Kein Sprite-Blending oder Fade zwischen Frames — harte Cuts entsprechen dem Pixel-Art-Stil.

### 3.8 Audio-Konzept

*(Vollimplementierung in Phase 5)*

Alle Sounds werden über die Web Audio API erzeugt oder abgespielt.

**Geplante Sound-Events:**

| Event | Typ | Beschreibung |
|---|---|---|
| Sprung | Kurzton | Federndes, quietschendes Geräusch (Plüschtier) |
| Landung | Kurzton | Dumpfes Aufsetzen |
| Wurf | Kurzton | Wurfgeräusch |
| Flut steigt | Loop | Wassergeräusch, wächst mit Flutpegel |
| Leben verloren | Effekt | Kurzes, komisches Geräusch |
| Game Over | Sequenz | Kurze Abschluss-Melodie |
| Hintergrundmusik | Loop | Level-spezifisch, ambient und locker |

**Audio-Grundsatz:**
Keine aggressiven oder erschreckenden Sounds. Ton unterstützt die „cozy danger"-Stimmung.

### 3.9 Typografie

| Verwendung | Schriftart | Größe | Farbe |
|---|---|---|---|
| HUD-Score | Pixel-Font / Arial | 16–18 px | UI-1 |
| Spieltitel (Start) | Pixel-Font / Arial Bold | 32–40 px | UI-2 |
| Hinweistexte | Arial | 14 px | UI-1 |

Keine mehr als zwei Schriftgrößen pro Screen. Alle Texte linksbündig oder zentriert — kein Flattersatz rechts.

---

## Anhang: Technische Architektur-Übersicht

**Dateistruktur (Quellcode):**

```
src/
├── main.js          — Hauptschleife, Initialisierung, Render-Orchestrierung
├── game-state.js    — Zustandsmaschine (GamePhase, GameState)
├── input.js         — Tastatur-/Mauslistener
├── player.js        — Spielerfigur, Sprung, Sprite-Logik, Wurf
├── platforms.js     — Plattformgenerierung, Kollision, Sprite-Rendering
├── water.js         — Flut-Mechanik, Wellendarstellung
└── background.js    — Parallax-Hintergrundsystem, Crossfade
```

**Update-Reihenfolge pro Frame (load-bearing):**
1. `updatePlayer(dt)`
2. `updatePlatforms(dt)`
3. `checkPlatformCollisions()`
4. `updateCamera()`
5. Render (Welt dann HUD)

**Zeitschritt:**
- Semi-fixes System: `dt = min(elapsed, 50)` in ms
- Alle Physik-Werte in px/s, multipliziert mit `dt / 1000`

---

*Dokument erstellt: März 2026*
*Letzte Aktualisierung: 12.03.2026*
