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
   - 2.5 Push-Mechanik
   - 2.6 Plattformen
   - 2.7 Gefahren-Mechanik (Hazard)
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

Die Atmosphäre vermittelt „cozy danger": Die Spielwelt ist warm und verspielt gestaltet, die Bedrohung durch die Flut baut aber kontinuierlich Spannung auf. Das Spiel ist in drei thematisch unterschiedliche Level gegliedert, die jeweils eigene Plattformtypen und Gefahren einführen.

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
| Levelbasiert (nicht Endlos) | 3 eigenständige Level mit je eigener Gefahr |
| Push-Mechanik | Schieben von Objekten als aktives Werkzeug auf Plattformen |

### 1.5 Plattform & Technologie

Das Spiel läuft vollständig im Browser ohne Plug-ins oder Build-Tools.

- **Sprache:** JavaScript (ES2022+), HTML5, CSS (nur Layout)
- **Rendering:** HTML Canvas 2D API (480×640 px, gesetzt via JS-Attribute)
- **Audio:** Web Audio API
- **Physik:** Eigenimplementierung (semi-fixes Zeitschritt-Modell, Delta-Cap 50 ms)
- **Hosting:** GitHub Pages
- **Keine externen Bibliotheken**

### 1.6 Umfang & Levelstruktur

Das Spiel enthält drei vollständige Spiellevel, je mit eigenem visuellen Thema und eigener Kernmechanik:

| Level | Titel | Setting | Besondere Gefahr |
|---|---|---|---|
| 1 | La Ciudad | Stadtgebäude, Jalousien | Steigender Smog |
| 2 | El Mar Abierto | Offener See, Masten/Stege | Steigende Flut (Sinuswelle) |
| 3 | El Pozo Eléctrico | Aufzugschacht | Steigende Elektrizität (3-Schicht-Blitze) |

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
| Push (Aktion) | Z | Rechtsklick |

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

### 2.5 Push-Mechanik

*(Vollimplementierung in Phase 5)*

- Taste Z / Rechtsklick schiebt Objekte auf Plattformen
- Mehrere Objekttypen: Score-Objekte (Punkte), Bonus-Objekte (zeitlimitierte Effekte), kulturelle Objekte (lateinamerikanische Elemente)
- Sprite-Wechsel: `push_rise` (am Boden oder kurz nach Sprung) / `push_peak` (in der Luft)
- Balancing-Werte werden in Phase 5 festgelegt

### 2.6 Plattformen

**Plattformtypen:**

| Typ | Verhalten | Visuell |
|---|---|---|
| Normal | Stabil, dauerhaft | Levelthema-Sprite (z.B. Jalousie) |
| Brüchig (Crumble) | Beginnt zu bröckeln nach Landung, verschwindet nach kurzer Zeit | Rissig gelb → Zerbröckelnd gelb (Zeile 4) |

**Generierung:**
- Plattformen werden prozedural generiert (Endlos-Scroll nach oben)
- Mindestabstand und maximaler Abstand begrenzen Sprungreichweite
- Plattformbreite variiert, zusammengesetzt aus: linker Kappe + gekachelter Mitte + rechter Kappe

**Level 1 — Jalousie:**
- Sprite-Sheet mit 7 Zeilen: Zeilen 1/2/3/5/6 = intakt (zufällig zugewiesen), Zeile 4 = gerissen, Zeile 7 = zerbröckelnd

### 2.7 Gefahren-Mechanik (Hazard)

Jedes Level hat eine eigene, stetig steigende Gefahr. Alle drei Gefahren teilen dieselbe Physik (Anstiegsgeschwindigkeit, Beschleunigung, Kollisionserkennung), unterscheiden sich aber visuell:

- **Level 1 (Smog):** Geschichtete Gradientenbänder mit Kosinus-Wölbung am oberen Rand und Glüheffekt
- **Level 2 (Flut):** Sinuswellen-Animation in WATER-1 (#2a5fa8)
- **Level 3 (Elektrizität):** Drei unabhängige Blitzschichten mit unterschiedlichen Frequenzen, Ankerpunkten und pulsierender Transparenz
- Kontakt mit der Gefahr = Leben verlieren
- Die Gefahr existiert in Weltkoordinaten; die Kamera folgt dem Spieler nach oben
- **Obergrenze:** L1-Smog stoppt 22 px unterhalb des Dachs (visuell bündig). L2/L3 steigen bis auf `levelGoalY` — die Gefahr füllt den gesamten Schacht/Turm
- **Ausblenden:** Beim Auslösen des Zielfeldes blendet die Gefahr über 1,2 s aus

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
| 1 (Stadt) | Steigender Smog | Geschichtete Gradientenbänder mit Kosinus-Wölbung; steigt kontinuierlich |
| 2 (Meer) | Steigende Flut | Sinuswellen-Animation; Flutstieg schneller als Level 1 |
| 3 (Aufzugschacht) | Steigende Elektrizität | 3-Schicht-Blitze mit unabhängigen Frequenzen und pulsierender Transparenz |

### 2.12 Levelstruktur im Detail

**Level 1 — La Ciudad (Stadtsetting):**
- Plattformthema: Jalousien an Stadtgebäuden
- Unsichtbare Plattformen auf Dekor-Elementen (Mülltonnen, Türrahmen, Gesims)
- Einstiegslevel, niedrigste Schwierigkeit
- Führt Sprung- und Bewegungsmechanik ein; Gefahr: steigender Smog

**Level 2 — El Mar Abierto (Offener See):**
- Plattformthema: Stege die von Masten/Pfählen ausgehen
- Hintergrundferne Schicht: Weite See, Horizont, Sonne mit Puls-Animation; Gerüst hinter dem Raketenturm
- Raketenturm: getilelter Schaft mit Gerüst-Parallaxe; Raketen-Top schließt nahtlos an den letzten Schaft-Tile an
- Flut steigt schneller als in Level 1; Sinuswellen-Darstellung; erreicht `levelGoalY`

**Level 3 — El Pozo Eléctrico (Aufzugschacht):**
- Start: Spieler steht im Fahrstuhl (Erdgeschoss). Die Katze klettert durch eine Decken-Luke in den Schacht.
- Decken-Mechanik: Nur die Luke (x=138–337) ist durchdringbar — der Rest der Fahrstuhldecke hat unsichtbare Kollider. Gleiches Prinzip am oberen Schachtausgang.
- Schachtboden: Linke und rechte Randbereiche begehbar. Die mittlere Öffnung (x=172–300) hat keinen Boden — Katze fällt zurück in den Fahrstuhl und verliert ein Leben.
- Dach: Nach dem Verlassen des Schachts kann die Katze frei auf dem Dachelement laufen; Hebel befindet sich auf dem Dach.
- Hintergrund: Fahrstuhl-Sprite (Boden) → Schacht-Boden-Sprite (überlappt Fahrstuhldecke nahtlos) → getilede Schacht-Wände → Schacht-Top mit goldenem Balken und Dachelement
- Parallax-Mid-Layer: Kabel/Rohr-Sprites (0,9×-Faktor) hinter den Schachtwänden
- Steigende Elektrizität als 3-Schicht-Blitzsystem; erreicht `levelGoalY`

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

**Verbindliche Quelle:** `docs/STYLE_GUIDE.md` — die dort definierte Palette ist die einzig gültige Version. Sie wurde in Phase 04.1 verabschiedet und ist für alle weiteren Phasen gesperrt.

Die folgende Tabelle ist eine Übersicht der Slot-Rollen. Genaue Hex-Werte immer aus dem Style Guide entnehmen.

| Slot | Rolle |
|---|---|
| BG-1 | Taghimmel |
| BG-2 | Nachthimmel / tiefer Hintergrund |
| BG-3 | Wolken-Highlight / warmer Akzent |
| BG-4 | Wolken-Schatten / mittlerer Hintergrundton |
| PLAT-1 | Plattformgrundfarbe |
| PLAT-2 | Plattformkante / Schatten |
| PLAT-3 | Brüchige Plattform (gerissener Zustand) |
| PLAT-4 | Brüchige Plattform (zerbröckelnder Zustand) |
| CAT-1 | Katzenkörper (Plüschbeige) |
| CAT-2 | Katzenschatten |
| CAT-3 | Katzenbauch / Highlight |
| CAT-4 | Katzenohr-Akzent |
| CAT-5 | Katzenknopfaugen |
| WATER-1 | Flut-Hauptfarbe |
| WATER-2 | Wellenkamm-Highlight |
| UI-1 | HUD-Text / UI-Elemente |

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
| Push Rise | `PixelArt/cat/push_rise.png` | Push am Boden / tief in der Luft |
| Push Peak | `PixelArt/cat/push_peak.png` | Push auf Höhepunkt |
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
- 7 Reihen im Sheet: 5 intakte Zustände, 1 gerissen (gelb, Reihe 4), 1 zerbröckelnd (gelb, Reihe 4)
- 3-teiliges Rendering: linke Kappe + gekachelte Mitte + rechte Kappe
- Zufällige Zeile pro Plattform bei Generierung (aus Zeilen 1,2,3,5,6)

Weitere Plattform-Designs für Level 2 und 3 werden in späteren Phasen erstellt.

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

*(Vollimplementierung in Phase 6)*

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
├── hazards.js       — Hazard-System (Smog, Flut, Elektrizität)
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
*Letzte Aktualisierung: 16.03.2026*
