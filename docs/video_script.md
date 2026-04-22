# Gameplay-Video — Skript

**Projekt:** Soggy Moggy / Gato Sin Botas
**Verfasser:** Julian Gomez
**Stand:** 21.04.2026
**Zielgruppe:** Dozent der SRH Fachschulen, Fachrichtung Game & Multimedia Design
**Länge (vorgeschlagen):** 2 bis 4 Minuten
**Tonalität:** neutral-dokumentarisch (Default). Der Sprecher-Text ist als Entwurf zu verstehen und kann von Julian nach Gusto angepasst werden, zum Beispiel in Richtung Trailer oder locker-persönlich.

---

## Szenen-Gliederung

Gesamtlänge im Entwurf: ca. 2:35. Puffer ist eingeplant, Szenen können gekürzt werden, falls das Video insgesamt kürzer werden soll.

### Szene 1 — Titelkarte (0:00–0:03)

- **Visual:** Schwarzes Bild, dann Einblendung des Schriftzugs „Gato Sin Botas" mittig. Darunter kleiner Zusatz „Abschlussprojekt SRH Fachschulen, Julian Gomez, 2026".
- **Sprecher-Text:** keiner.
- **Hinweise:** kurzer Schnitt, kein Jingle. Falls Musik gewünscht, ab hier leise einblenden.

### Szene 2 — Projektvorstellung (0:03–0:18)

- **Visual:** Start-Screen des Spiels, dann Zoom oder Cut auf den oberen Teil des Start-Screens. Danach kurzer Blick auf das Level-Auswahl-Verhalten (Enter drücken).
- **Sprecher-Text (Entwurf):**
  „Soggy Moggy, im Spiel Gato Sin Botas, ist ein vertikaler Plattformer, der im Browser läuft. Eine ausgestopfte Katze springt von Plattform zu Plattform und flieht vor einer Gefahr, die von unten steigt. Das Spiel läuft ohne Framework, komplett in Vanilla JavaScript."
- **Hinweise:** Text ruhig sprechen, ca. 15 Sekunden. Parallel zeigt das Bild den Startbildschirm, keine Spielbewegung.

### Szene 3 — Level 1 Gameplay (0:18–0:48)

- **Visual:** Live-Gameplay in Level 1 „La Ciudad". Zeigen: Sprung-Mechanik, Laufanimation, Hazard-Smog, der von unten nachzieht. Gegen Ende eine Wespe passieren oder stompen.
- **Sprecher-Text (Entwurf):**
  „Im ersten Level läuft der Spieler durch ein Stadtgebäude und springt auf Jalousien. Der Sprung ist manuell, keine Automatik. Unter der Spielfigur steigt Smog, der beim Kontakt ein Leben kostet. Wespen patrouillieren, und wer ihnen von oben auf den Rücken springt, schaltet sie aus."
- **Hinweise:** 30 Sekunden reine Spielaufnahme, saubere Eingaben, möglichst kein Sterben. Falls Leben verloren wird, nicht schneiden, sondern ruhig weiterspielen.

### Szene 4 — Level 2 Gameplay (0:48–1:18)

- **Visual:** Level 2 „El Pozo Eléctrico". Zeigen: Start im Fahrstuhl, Wechsel durch die Decken-Luke in den Schacht, Klettern zwischen den Rohren, Elektrizität als Gefahr am unteren Bildrand.
- **Sprecher-Text (Entwurf):**
  „Im zweiten Level startet die Katze im Fahrstuhl. Nur die Decken-Luke in der Mitte ist durchlässig, alles andere stoppt die Figur. Oben folgt der Aufzugschacht mit einem eigenen Plattform-Set. Die Gefahr ist hier Elektrizität, dargestellt als drei pulsierende Blitzschichten."
- **Hinweise:** 30 Sekunden. Wenn möglich, eine Ballon-Szene mitspielen, damit die Z-Taste / Rechtsklick-Aktion gezeigt wird.

### Szene 5 — Level 3 Gameplay (1:18–1:48)

- **Visual:** Level 3 „El Mar Abierto". Zeigen: Leuchtturm, Brücken zwischen Felsvorsprüngen, Sonne mit Puls-Animation, steigende Flut als Sinuswelle.
- **Sprecher-Text (Entwurf):**
  „Im dritten Level spielt die Szene am offenen Meer vor einem Leuchtturm. Die Flut steigt kontinuierlich und verkürzt den Raum. Wolkenplattformen sinken, wenn die Katze darauf steht, das erzeugt Zeitdruck in Kombination mit der Welle."
- **Hinweise:** 30 Sekunden. Finale Zielplattform oben möglichst erreichen, damit der Level-Complete-Screen kurz zu sehen ist.

### Szene 6 — Technik-Kurzblick (1:48–2:03)

- **Visual:** kurzer Split zwischen Code-Editor (eine `.js`-Datei, zum Beispiel `src/platforms.js`) und dem laufenden Spiel. Alternativ: Screencapture der Ordnerstruktur `src/`.
- **Sprecher-Text (Entwurf):**
  „Das Spiel läuft vollständig im Browser, ohne Build-Schritt. Rendering über die Canvas-2D-API, Auflösung 480 mal 640 Pixel. Keine Frameworks, keine externen Bibliotheken. Alle Pixel-Art-Sprites wurden in Pixelorama gezeichnet."
- **Hinweise:** 15 Sekunden, kein Scroll durch langen Code, nur kurz Atmosphäre zeigen.

### Szene 7 — Credits (2:03–2:13)

- **Visual:** Einfache Textkarte mit drei Zeilen: „Design und Code: Julian Gomez", „Fonts: Vecteezy.com", „SRH Fachschulen GME-24.01, Abschlussprojekt 2026".
- **Sprecher-Text:** keiner.
- **Hinweise:** statische Karte, ca. 10 Sekunden, dann langsamer Blend zu Schwarz.

---

## Allgemeine Aufnahme-Hinweise

- Canvas im Browser-Fenster passend zur nativen Auflösung (480 × 640) aufzeichnen, damit keine Skalierungsartefakte entstehen.
- Aufnahme idealerweise mit OBS, 60 fps, MP4-H.264.
- Mikrofon: leiser Raum, kein Rauschen. Nachträglich normalisieren reicht.
- Falls der Sprecher-Text nicht gewünscht ist: Kärtchen mit Kurztexten einblenden statt Voice-Over. Inhalt der Kärtchen entspricht den Kern-Sätzen oben.
- Kein Musik-Bett mit Lizenzproblemen. Entweder stille Aufnahme oder selbstgemachte Web-Audio-Sounds (Phase 6).

## Offene Punkte

1. Aufnahme-Setup (Kamera des Spiels, Mikrofon) noch nicht final getestet.
2. Wenn Audio aus dem Spiel selbst mitläuft (ab Phase 6), kann der Sprecher-Text leiser gemischt oder ganz weggelassen werden.
3. Datum der Videoaufnahme abhängig vom neuen Abgabetermin.
