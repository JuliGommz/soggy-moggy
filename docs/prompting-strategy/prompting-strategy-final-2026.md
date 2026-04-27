# Prompting-Strategie: Soggy Moggy

**Eingereicht von:** Julian Gomez  
**Projekt:** Soggy Moggy (Abschlussprojekt SRH 2026, Programmierung)  
**Zeitraum:** März bis April 2026  
**Quelldokumente:** `docs/PROMPTING_LOG.md`, `.planning/STATE.md`, GSD-Phasenprotokolle

---

## 1. Grundprinzip

Ich habe Claude Code nicht frei werkeln lassen, sondern als Werkzeug in einem strukturierten Planungssystem geführt. Jede Phase begann mit Recherche und einem geprüften Plan, bevor Code geschrieben wurde. Was gebaut wird, in welcher Reihenfolge, und was gestrichen oder geändert wird, war immer meine Entscheidung.

---

## 2. Das Planungssystem (GSD)

Alle Phasen liefen über das GSD-Framework (Get Shit Done), das folgende Kommandos bereitstellt:

| Kommando | Funktion |
|----------|----------|
| `/gsd:new-project` | Roadmap und Requirements-Katalog erstellen |
| `/gsd:list-phase-assumptions N` | KI-Annahmen vor der Ausführung sichtbar machen |
| `/gsd:plan-phase N` | Recherche-, Planungs- und Prüf-Agenten spawnen |
| `/gsd:execute-phase N` | Executor-Agenten führen Pläne Schritt für Schritt aus |
| `/gsd:verify-work` | Verifikations-Agent prüft ob das Phasenziel wirklich erreicht wurde |

Der Ablauf war immer: **Verstehen → Annahmen prüfen → Planen → Ausführen → Verifizieren.** Nie direkt "schreib mir Code für X".

---

## 3. Steuerung (Agency): Konkrete Beispiele

### 3.1 MVP-Grenze gesetzt

In der ersten Planungssession habe ich festgelegt:

> "Most important point is to get a functioning MVP. Good separation of MVP features and all else."

Das war keine allgemeine Aussage, sondern eine bindende Planungsgrenze. Eine explizite MVP-Tabelle mit "Muss" und "Später" wurde in das Protokoll aufgenommen und durch alle Phasen hindurch als Entscheidungshilfe genutzt.

Konsequenzen aus dieser Direktive:
- Level 4 (Freizeitpark) wurde am 2026-03-16 gestrichen — nicht MVP-relevant.
- Der Push-Mechanismus war Phase 5's ursprüngliches Kernfeature. Im April 2026 habe ich ihn vollständig verworfen, obwohl bereits ein detailliertes Design-Dokument existierte.
- Die Z-Taste wurde behalten, aber für Ballon, Wespe und Outro-Trigger umgewidmet.

### 3.2 Dozenten-Feedback als Planungseingang

Nach der Präsentation am 25.03.2026 habe ich vier Teacher-Anforderungen direkt in das GSD-Planungssystem eingebracht. Ich habe die Punkte nicht als Wunschliste behandelt, sondern sofort die Konsequenz gezogen:

- **FB-03 (Leuchtturm statt Rakete):** Neue Phase 04.2 erstellt. Entscheidung dokumentiert als: "Leuchtturm wird implementiert. Alle Raketen-Sprites werden nicht mehr verwendet." Rocket-Sprites wurden verworfen, obwohl erhebliche Pixelart-Arbeit darin steckte.
- **FB-01 (NPCs):** Wespen-Gegner-System als eigenständige Phase 05-e implementiert.
- **FB-02/04 (Kletter-Kiste, Ballon):** In Phase 5 integriert.

### 3.3 Technische Grenzen zuerst definieren

Ich habe in der Pre-Phase festgelegt: kein Build-Tool, kein Dev-Server, keine ES6-Module. Das Spiel muss per USB-Stick mit `index.html`-Doppelklick in jedem Browser laufen.

Diese Entscheidung hat alle folgenden Technologiewahlen geformt und zwei explizite KI-Korrekturen erzwungen:

- **Audio:** Ein Forschungs-Agent behauptete "XHR funktioniert auf `file://` in Chromium." Das stimmt für Chromium. Firefox blockiert XHR auf `file://` für alle lokalen Dateien. Ich habe in Firefox getestet, die Einschränkung erkannt, und die KI angewiesen, auf HTMLAudio umzustellen.
- **Start-Menü:** Ein Agent schlug Babel/JSX vor. Babel nutzt intern XHR für `<script type="text/babel">`, das auf `file://` durch CORS blockiert wird. Ich habe das abgelehnt und stattdessen `React.createElement()` ohne Transpiler gewählt.

---

## 4. Verständnis (Understanding): Konkrete Beispiele

### 4.1 Warum `prevY` vor der Physikaktualisierung gespeichert wird

One-way Kollision braucht die Füße-Position aus dem letzten Frame, um zu prüfen ob der Spieler die Plattform von oben nach unten durchquert hat. Wird `prevY` nach `vy += GRAVITY * dt` gespeichert, ist es bereits der aktuelle Frame — die Kollision feuert durch Böden hindurch. Ich kann das erklären, weil ich es beim Code-Review gelesen und verstanden habe, nicht weil es automatisch entstand.

### 4.2 Warum `lives` nicht in `startNextLevel()` zurückgesetzt werden

Das ist eine bewusste Designentscheidung, die die Schwierigkeitskurve über drei Level erzeugt. Wer mit drei Leben in Level 1 startet und zwei verliert, kämpft Level 2 mit einem Leben. Das macht das Spiel progressiv anspruchsvoller ohne jeden Parameter anfassen zu müssen. Die Entscheidung steht in `STATE.md` unter "Key Decisions Made" mit Begründung.

### 4.3 Sound-Latenz als dokumentierte Einschränkung

HTMLAudio auf `file://` hat eine Start-Latenz von 70-140ms pro Sound (Seek-Zyklus nach Reload). Der Sprungsound kommt hörbar später als die Aktion. Ich habe entschieden: nicht beheben, sondern dokumentieren. Das GDD enthält jetzt eine Section "Bekannte Einschränkungen" mit technischer Begründung. Eine sauberere Lösung wären base64-encodierte Audio-Data-URIs, das ist aber ein größerer Umbau und für die Abgabe nicht nötig.

### 4.4 `imageSmoothingEnabled` auf jedem Canvas-Kontext

`main.js` setzt `imageSmoothingEnabled = false` beim Canvas-Init einmalig. Das funktioniert für das Hauptspiel. Aber jeder React-Overlay (Start-Screen, Success-Screen) erzeugt seinen eigenen Canvas-Kontext, der defaultmäßig auf `true` steht. Das Ergebnis war ein abgeschnittener unterer Outline bei Buchstaben wie "O" im Titel. Ich habe den Bug erkannt und gezielt auf beide Overlay-Kontexte angewendet.

---

## 5. Bewertung (Evaluation): Was verworfen oder korrigiert wurde

### 5.1 Strategische Verwerfungen

| Was | Wann | Begründung |
|-----|------|------------|
| Level 4 Freizeitpark | März 2026 | Nicht MVP-kritisch |
| Push-Mechanismus (Kernfeature Phase 5) | April 2026 | Zu komplex; Spielwert rechtfertigt den Aufwand nicht |
| Spanisch als Sprachschicht ("Gato sin Botas") | April 2026 | Font-Atlas mit Sonderzeichen technisch aufwändiger als nötig |
| Web Audio API | April 2026 | Chromium-only; Firefox auf `file://` inkompatibel |
| Babel/JSX für Start-Menü | April 2026 | XHR-Abhängigkeit blockiert auf `file://` |
| Raketen-Sprites L2 | April 2026 | Teacher-Feedback: Leuchtturm gewünscht; Kosten akzeptiert |
| Cat1_beishe Richtung | März 2026 | Grey-pink passt besser zum Spielcharakter |

### 5.2 Korrekturen nach KI-Output

**Cloud-Drift-Multiplier:** Die KI setzte Enlightened auf 1.75x und Adventurer auf 1.00x. Nach eigenem Playtesting war der Drift zu hoch: Adventurer 1.00→0.80, Enlightened 1.75→1.40. Spielgefühl kann nur ich beurteilen.

**Dialogblasen-Positionen:** Endwerte (z.B. `l3_outro`: Y=90, X=-110) wurden in mehreren Iterationen angepasst und sind explizit als "locked" in `STATE.md` eingetragen. Änderungen nur mit meiner Genehmigung.

**Outro-Trigger Save-Stack-Leak:** Die Windrad-Animation zeigte nach einigen Sekunden einen "broken mirror effect". Ursache: `ctx.restore()` stand außerhalb der for-Schleife statt innerhalb. Ich habe das Symptom erkannt, die Ursache nachgefragt, und die Korrektur angewiesen.

---

## 6. Die vier Kernmuster meiner Strategie

**Muster 1: Planen vor coden.**  
Jede Phase begann mit Recherche und einem verifizierten Plan. `list-phase-assumptions` hat mir explizit gezeigt, welche Annahmen die KI trifft, bevor ich ausführen ließ.

**Muster 2: Klar abgegrenzte Phasen.**  
Jede Phase hatte ein Ziel, eine Erfolgsdefinition, und einen Verifikationsschritt. Die KI wusste immer, was außerhalb des aktuellen Scopes lag.

**Muster 3: Externe Inputs direkt einarbeiten.**  
Dozenten-Feedback, Playtesting-Ergebnisse, Browser-Tests. Jedes Mal wenn etwas nicht stimmte, habe ich nicht gewartet ob die KI es selbst bemerkt, sondern explizit gesagt was zu ändern ist und warum.

**Muster 4: Deployment-Kontext als feste Rahmenbedingung.**  
`file://`, kein Build-Tool, Firefox-kompatibel. Diese Constraints habe ich in der Pre-Phase gesetzt und nie aufgeweicht. Jede Technologieentscheidung lässt sich auf diesen Rahmen zurückführen.

---

## 7. Vollständiges Phasenprotokoll

`docs/PROMPTING_LOG.md` — chronologisches Protokoll aller Phasen (Pre-Phase bis Phase 6) mit konkreten Kommandos, Julian's Anweisungen, verworfenen Optionen, und GSD-Outputs.

---

*Dokument erstellt: 2026-04-27*  
*Basis: automatisches Prompting-Log + GSD-Planungsartefakte (Pre-Phase bis Phase 6)*
