// create_docs.js — Projektplan + Arbeitsprotokoll for Soggy Moggy
// Run: node create_docs.js

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

// ── Page setup (§8 Handout: A4, links 5cm, rechts 2cm, 1,5-zeilig, Arial 12pt) ─
const PAGE_W    = 11906;           // A4 width DXA
const PAGE_H    = 16838;           // A4 height DXA
const M_LEFT    = 2835;            // 5 cm
const M_RIGHT   = 1134;            // 2 cm
const M_TOP     = 1134;
const M_BOTT    = 1134;
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT;  // 7937 DXA

// GDD-spezifische Ränder (vom Nutzer festgelegt)
const GDD_M_LEFT  = 1276;
const GDD_M_RIGHT = 1134;
const GDD_CW      = PAGE_W - GDD_M_LEFT - GDD_M_RIGHT;  // 9496 DXA

// Aktive Inhaltsbreite — wird vor GDD-Content auf GDD_CW gesetzt
let ACTIVE_CW = CONTENT_W;

const FONT = 'Arial';
const FS_BODY   = 24;   // 12pt body text
const FS_CELL   = 18;   // 9pt  table data (prevents overflow in narrow columns)
const FS_HEAD   = 20;   // 10pt table header
const FS_SMALL  = 16;   // 8pt  footer/header
const SPACING   = 360;  // 1.5× line spacing

// ── Table borders ──────────────────────────────────────────────────────────
const B = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
const borders = { top: B, bottom: B, left: B, right: B };

// ── Cell builders ──────────────────────────────────────────────────────────
function hCell(text, w) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders,
    shading: { fill: '2C4770', type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240, lineRule: 'auto' },
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: FONT, size: FS_HEAD })]
    })]
  });
}

function dCell(text, w, { center = false, bold = false } = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { line: 240, lineRule: 'auto' },
      children: [new TextRun({ text: String(text), bold, font: FONT, size: FS_CELL })]
    })]
  });
}

// ── Document helpers ───────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    spacing: { before: 320, after: 200, line: SPACING, lineRule: 'auto' },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2C4770', space: 6 } },
    children: [new TextRun({ text, bold: true, font: FONT, size: 28, color: '2C4770' })]
  });
}
function meta(text) {
  return new Paragraph({
    spacing: { after: 80, line: SPACING, lineRule: 'auto' },
    children: [new TextRun({ text, font: FONT, size: FS_BODY })]
  });
}
function note(text) {
  return new Paragraph({
    spacing: { before: 160, line: SPACING, lineRule: 'auto' },
    children: [new TextRun({ text, font: FONT, size: FS_CELL, color: '666666' })]
  });
}
function gap() {
  return new Paragraph({ spacing: { after: 160 }, children: [] });
}
function h2(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120, line: SPACING, lineRule: 'auto' },
    children: [new TextRun({ text, bold: true, font: FONT, size: 24, color: '2C4770' })]
  });
}
function body(text) {
  return new Paragraph({
    spacing: { after: 100, line: SPACING, lineRule: 'auto' },
    children: [new TextRun({ text, font: FONT, size: FS_BODY })]
  });
}
function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}
function infoTable(rows) {
  const W1 = Math.round(2200 * ACTIVE_CW / CONTENT_W);
  const W2 = ACTIVE_CW - W1;
  return new Table({
    width: { size: ACTIVE_CW, type: WidthType.DXA },
    columnWidths: [W1, W2],
    rows: rows.map(([lbl, val], i) => new TableRow({ children: [
      new TableCell({
        width: { size: W1, type: WidthType.DXA }, borders,
        shading: { fill: i % 2 === 0 ? 'EEF4FA' : 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 70, bottom: 70, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ spacing: { line: 240, lineRule: 'auto' },
          children: [new TextRun({ text: lbl, bold: true, font: FONT, size: FS_CELL })] })]
      }),
      new TableCell({
        width: { size: W2, type: WidthType.DXA }, borders,
        shading: { fill: i % 2 === 0 ? 'EEF4FA' : 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 70, bottom: 70, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ spacing: { line: 240, lineRule: 'auto' },
          children: [new TextRun({ text: val, font: FONT, size: FS_CELL })] })]
      }),
    ]}))
  });
}
function tableN(headers, rows, widths) {
  let sw;
  if (ACTIVE_CW === CONTENT_W) {
    sw = widths;
  } else {
    const scale = ACTIVE_CW / CONTENT_W;
    const partials = widths.slice(0, -1).map(w => Math.round(w * scale));
    sw = [...partials, ACTIVE_CW - partials.reduce((a, b) => a + b, 0)];
  }
  return new Table({
    width: { size: ACTIVE_CW, type: WidthType.DXA },
    columnWidths: sw,
    rows: [
      new TableRow({ children: headers.map((h, i) => hCell(h, sw[i])) }),
      ...rows.map(r => new TableRow({ children: r.map((v, i) => dCell(v, sw[i])) }))
    ]
  });
}

// ── Section wrapper ────────────────────────────────────────────────────────
function section(children, mOverride = {}) {
  const margin = { top: M_TOP, right: M_RIGHT, bottom: M_BOTT, left: M_LEFT, ...mOverride };
  const cw = PAGE_W - margin.left - margin.right;
  return {
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 1 } },
        children: [
          new TextRun({ text: 'SRH Berufsfachschule | GME-24.01 | Abschlussarbeit 2026',
            font: FONT, size: FS_SMALL, color: '888888' }),
          new TextRun({ text: '\t', font: FONT, size: FS_SMALL }),
          new TextRun({ text: 'Gomez, Julian',
            font: FONT, size: FS_SMALL, bold: true, color: '888888' }),
        ],
        tabStops: [{ type: 'right', position: cw }]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 1 } },
        children: [
          new TextRun({ text: 'Seite ', font: FONT, size: FS_SMALL, color: '888888' }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FS_SMALL, color: '888888' }),
          new TextRun({ text: ' von ', font: FONT, size: FS_SMALL, color: '888888' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: FS_SMALL, color: '888888' }),
        ]
      })] })
    },
    children
  };
}

// ══════════════════════════════════════════════════════════════════════════
// PROJEKTPLAN
// Realistic 34-AT sequential plan (04.03–22.04.2026, excl. Easter 03./06.04)
// GDD is split across 3 phases: Grobkonzept early, Feinkonzept mid, Designkonzept during art
// ══════════════════════════════════════════════════════════════════════════

// Col widths: Nr(500) | Aufgabe(3700) | Anfang(1200) | Ende(1200) | Dauer(1337) = 7937
const PP = { NR: 500, AUFG: 3700, VON: 1200, BIS: 1200, DUR: 1337 };

const pp_rows = [
  // Nr  Aufgabe                                                  Anfang        Ende          Dauer
  [ '1', 'Konzept, Recherche & Themeneinreichung',              '04.03.2026', '06.03.2026', '3 AT'  ],
  [ '2', 'Grobkonzept (GDD) & Projektplanung',                  '09.03.2026', '11.03.2026', '3 AT'  ],
  [ '3', 'Spielgrundlage: Canvas, Gameloop, Eingabe, Zustände', '12.03.2026', '18.03.2026', '5 AT'  ],
  [ '4', 'Spielmechanik: Physik, Kollision, Kamera, Levelwelt', '19.03.2026', '27.03.2026', '7 AT'  ],
  [ '5', 'Feinkonzept (GDD) & Visual Concept: Stilguide, Farbe','30.03.2026', '02.04.2026', '4 AT'  ],
  [ '6', 'Pixel Art: Sprites & UI  +  Designkonzept (GDD)',     '07.04.2026', '11.04.2026', '5 AT'  ],
  [ '7', 'Wurfmechanik, Sounddesign & Sprite-Integration',      '14.04.2026', '17.04.2026', '4 AT'  ],
  [ '8', 'Hosting: GitHub Pages, Deployment & Browsertest',     '20.04.2026', '20.04.2026', '1 AT'  ],
  [ '9', 'Medienkatalog, README & Abgabevorbereitung',          '21.04.2026', '22.04.2026', '2 AT'  ],
];
// Total: 3+3+5+7+4+5+4+1+2 = 34 AT ✓
// Easter: 03.04 (Karfreitag) + 06.04 (Ostermontag) excluded from date ranges

const ppTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [PP.NR, PP.AUFG, PP.VON, PP.BIS, PP.DUR],
  rows: [
    new TableRow({ children: [
      hCell('Nr.',           PP.NR),
      hCell('Aufgabe',       PP.AUFG),
      hCell('Anfang',        PP.VON),
      hCell('Ende',          PP.BIS),
      hCell('Dauer (AT)',    PP.DUR),
    ]}),
    ...pp_rows.map(([nr, aufg, von, bis, dur]) => new TableRow({ children: [
      dCell(nr,   PP.NR,   { center: true }),
      dCell(aufg, PP.AUFG),
      dCell(von,  PP.VON,  { center: true }),
      dCell(bis,  PP.BIS,  { center: true }),
      dCell(dur,  PP.DUR,  { center: true }),
    ]}))
  ]
});

const projektplanDoc = new Document({
  styles: { default: { document: { run: { font: FONT, size: FS_BODY } } } },
  sections: [section([
    h1('Projektplan – Abschlussarbeit 2026'),
    meta('Projekt: Soggy Moggy  |  Rahmenthema 3: Casual Webgame'),
    meta('Zeitraum: 04.03.2026 – 22.04.2026  |  Gruppe: GME-24.01  |  Name: Julian Gomez'),
    gap(),
    ppTable,
    note('AT = Arbeitstag (Mo–Fr). Ostertage (03.04 + 06.04) ausgenommen. GDD = Game Design Document (Grob-, Fein-, Designkonzept). Abweichungen im Arbeitsprotokoll dokumentiert.'),
  ])]
});

// ══════════════════════════════════════════════════════════════════════════
// ARBEITSPROTOKOLL
// Col widths: Datum(1500) | Aufgabe(4337) | geplant(700) | IB(700) | erl(700) = 7937
// Font 9pt in cells to prevent overflow in narrow status columns
// ══════════════════════════════════════════════════════════════════════════

const AP = { DAT: 1500, AUFG: 4337, GP: 700, IB: 700, ERL: 700 };
const X = 'x';

const ap_rows = [
  // Datum          Aufgabe (max ~55 chars)                               GP  IB  ERL
  ['04.03.2026', 'Spielkonzept definieren, Themeneinreichung',           X,  X,  X],
  ['04.03.2026', 'Technische Recherche (Canvas, Gameloop, State)',       X,  X,  X],
  ['05.03.2026', 'GSD Roadmap: Requirements + Phasenplanung',            X,  X,  X],
  ['05.03.2026', 'Phase 1: HTML-Shell, Canvas-Setup, GamePhase Enum',   X,  X,  X],
  ['05.03.2026', 'Phase 1: Gameloop mit Delta Time, Spieler-Stub',      X,  X,  X],
  ['06.03.2026', 'Phase 2: Gravity, Auto-Bounce, AABB-Kollision',        X,  X,  X],
  ['06.03.2026', 'Phase 2: Kamera-Scrolling, Fall-Erkennung',           X,  X,  X],
  ['06.03.2026', 'Phase 3: LEVEL_COMPLETE, High Score, LocalStorage',   X,  X,  X],
  ['06.03.2026', 'Phase 3: Prozedurale Plattformen, Crumble-Zustand',   X,  X,  X],
  ['06.03.2026', 'Phase 3: Start-/GameOver-Screens, HUD, Ziellinie',    X,  X,  X],
  ['06.03.2026', 'Phase 4: Wassermodul, Sinus-Welle, Flutanstieg',      X,  X,  X],
  ['06.03.2026', 'Phase 4: Lebenssystem, Schaden-Flash, Respawn',       X,  X,  X],
  ['07.03.2026', 'Phase 04.1: Recherche, 16-Farb-Palette entwickeln',   X,  X,  X],
  ['07.03.2026', 'Phase 04.1: PLAN.md erstellt und verifiziert',        X,  X,  X],
  ['08.03.2026', 'Phase 04.1: STYLE_GUIDE.md (Palette, Stilregeln)',    X,  X,  X],
  ['08.03.2026', 'Phase 04.1: Palette-Datei + Plattform-Farben',        X,  X,  X],
  ['08.03.2026', 'Phase 04.1: palette_preview.html (Designreferenz)',   X,  X,  X],
  ['08.03.2026', 'Schulformalitaeten: Projektplan + Arbeitsprotokoll',  X,  X,  X],
  ['09.03.2026', 'Phase 04.1: Design-Entscheidungen (Spanisch, 4 Level)',X,  X,  X],
  ['09.03.2026', 'Phase 04.1: ASSET_LIST.md + Levelstruktur dokumentiert',X, X,  X],
  ['09.03.2026', 'PixelArt-Ordner umstrukturiert (Naming Convention)',  X,  X,  X],
  ['09.03.2026', 'Sprite-Pfade in player.js, background.js, platforms.js',X,X,  X],
  ['09.03.2026', 'Phase 05 initialisiert (Wurfmechanik + Sound)',        X,  X,  X],
  ['10.03.2026', 'Sprites umbenannt: idle/rise/peak/push_rise/push_peak',X,  X,  X],
  ['10.03.2026', 'Feature-Branch asset-restructure-mechanics erstellt',  X,  X,  X],
  ['10.03.2026', 'Scope-Evolution: Titel, Steuerung WASD+Maus, HUD-Fix',X,  X,  X],
  ['10.03.2026', 'Hazard-Rename: resetWater zu resetHazard generalisiert',X, X,  X],
  ['10.03.2026', 'Maus-Eingabe: Left-Click=Jump, Right-Click=Action',    X,  X,  X],
  ['11.03.2026', 'Auto-Bounce entfernt: manuelle Sprung-Mechanik',       X,  X,  X],
  ['11.03.2026', 'Walk-Animation integriert (walk_1/2, 150ms-Zyklus)',   X,  X,  X],
  ['11.03.2026', 'Sprite Y-Offsets: PIL alpha-scan, per-Frame-System',   X,  X,  X],
  ['12.03.2026', 'Paralax-Fix: Gebaeude + Fenster scrollen 1:1',         X,  X,  X],
  ['12.03.2026', 'Unsichtbare Plattform: Gebaeude-Gesims (y=342)',        X,  X,  X],
  ['12.03.2026', 'Platform-Fix: nur Slots mit Fenstern generieren',       X,  X,  X],
  ['12.03.2026', 'GamePhase PAUSED + restartLevel() hinzugefuegt',        X,  X,  X],
  ['12.03.2026', 'ESC-Pause: menuCursor + ArrowUp/Down Navigation',       X,  X,  X],
  ['12.03.2026', 'LEVEL_COMPLETE-Screen: 4 Optionen mit Cursor',          X,  X,  X],
  ['12.03.2026', 'Key-Blocking: Enter/Jump beim Phasenuebergang',          X,  X,  X],
  ['12.03.2026', 'Variabler Sprung: Antippen kurz, Halten voll',           X,  X,  X],
  ['12.03.2026', 'Bugfix: JUMP_VELOCITY fuer Wasser-Respawn',              X,  X,  X],
  ['12.03.2026', 'Sprung-Tuning: Min -520 px/s, Boost 900/0.20s',          X,  X,  X],
  ['16.03.2026', 'Hazard-Rename: water-Objekt zu hazard + Eigenschaftsnamen',X, X,  X],
  ['16.03.2026', 'Hazard-Renderer: Smog (L1), Flut (L2), Elektrizitaet (L3)',X, X,  X],
  ['16.03.2026', 'Konstanten-Taxonomie: HAZARD_* (shared) vs FLOOD_WAVE_*', X,  X,  X],
  ['16.03.2026', 'Variabler Sprung +0.5%: Min -523, Boost 905 px/s²',       X,  X,  X],
  ['16.03.2026', 'L1 unsichtbare Plattformen: Boden, Muelltonnen, Tuer',    X,  X,  X],
  ['16.03.2026', 'PIL Alpha-Scan: exakte Koordinaten fuer L1-Collider',      X,  X,  X],
  ['16.03.2026', 'Starter-Plattform nur L2; L1+L3 unsichtbarer Boden',      X,  X,  X],
  ['16.03.2026', 'Crumble-Farbe: Zerbroeckelnd gelb statt rot (Zeile 4)',   X,  X,  X],
  ['16.03.2026', 'Level-abhaengiger Spawn: L1+L3 y=596, L2 y=528',          X,  X,  X],
  ['16.03.2026', '3-Schicht-Elektrizitaet: unabhaengige Frequenzen+Alpha',  X,  X,  X],
  ['16.03.2026', 'Scope-Reduktion: 4 Level auf 3 (L4 Freizeitpark gestrichen)',X,X,  X],
  ['16.03.2026', 'GDD + Arbeitsprotokoll aktualisiert (alle Aenderungen)',   X,  X,  X],
];

const apTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [AP.DAT, AP.AUFG, AP.GP, AP.IB, AP.ERL],
  rows: [
    new TableRow({ children: [
      hCell('Datum',          AP.DAT),
      hCell('Aufgabe',        AP.AUFG),
      hCell('geplant',        AP.GP),
      hCell('in Bearb.',      AP.IB),
      hCell('erledigt',       AP.ERL),
    ]}),
    ...ap_rows.map(([dat, aufg, gp, ib, erl]) => new TableRow({ children: [
      dCell(dat,  AP.DAT,  { center: true }),
      dCell(aufg, AP.AUFG),
      dCell(gp,   AP.GP,   { center: true }),
      dCell(ib,   AP.IB,   { center: true }),
      dCell(erl,  AP.ERL,  { center: true }),
    ]}))
  ]
});

const arbeitsprotokollDoc = new Document({
  styles: { default: { document: { run: { font: FONT, size: FS_BODY } } } },
  sections: [section([
    h1('Arbeitsprotokoll – Abschlussarbeit 2026'),
    meta('Projekt: Soggy Moggy  |  Rahmenthema 3: Casual Webgame'),
    meta('Zeitraum: 04.03.2026 – 22.04.2026  |  Gruppe: GME-24.01  |  Name: Julian Gomez'),
    gap(),
    apTable,
    note('Dieses Protokoll wird täglich fortgeführt. geplant/in Bearb./erledigt markiert mit "x". Fortschritte im Git-Repository dokumentiert (Commits mit Zeitstempel).'),
  ])]
});

// ══════════════════════════════════════════════════════════════════════════
// GAME DESIGN DOCUMENT
// Dreiteiler: Grobkonzept + Feinkonzept + Designkonzept
// ══════════════════════════════════════════════════════════════════════════

ACTIVE_CW = GDD_CW;
const gddContent = [
  // ── Titelseite ──────────────────────────────────────────────────────
  new Paragraph({ spacing: { before: 1440, after: 240 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Game Design Document', bold: true, font: FONT, size: 48, color: '2C4770' })] }),
  new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Soggy Moggy', bold: true, font: FONT, size: 36, color: '2C4770' })] }),
  new Paragraph({ spacing: { after: 160 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Gato Sin Botas', font: FONT, size: 28, color: '888888' })] }),
  new Paragraph({
    spacing: { before: 0, after: 320 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
    children: []
  }),
  new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Julian Gomez  |  GME-24.01', font: FONT, size: FS_BODY, color: '444444' })] }),
  new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'SRH Berufsfachschule  |  Abschlussarbeit 2026', font: FONT, size: FS_BODY, color: '444444' })] }),
  new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Abgabe: 22.04.2026  |  Rahmenthema 3: Casual Webgame', font: FONT, size: FS_BODY, color: '444444' })] }),
  pb(),

  // ── Inhaltsverzeichnis ────────────────────────────────────────────
  h1('Inhaltsverzeichnis'),
  gap(),
  ...[
    ['1',    'Grobkonzept',                        false],
    ['1.1',  'Projektübersicht',                   true],
    ['1.2',  'Spielidee & Kernaussage',            true],
    ['1.3',  'Zielgruppe',                         true],
    ['1.4',  'Einzigartiges Merkmal (USP)',         true],
    ['1.5',  'Plattform & Technologie',            true],
    ['1.6',  'Levelübersicht',                     true],
    ['2',    'Feinkonzept',                        false],
    ['2.1',  'Spielzustände & Spielfluss',         true],
    ['2.2',  'Steuerung',                          true],
    ['2.3',  'Spielerfigur',                       true],
    ['2.4',  'Bewegung & Sprung',                  true],
    ['2.5',  'Push-Mechanik',                      true],
    ['2.6',  'Plattformtypen',                     true],
    ['2.7',  'Gefahren-Mechanik (Hazard)',         true],
    ['2.8',  'Leben & Scheitern',                  true],
    ['2.9',  'Punkte & Highscore',                 true],
    ['2.10', 'Kamera & Weltkoordinaten',           true],
    ['2.11', 'Gefahren pro Level',                 true],
    ['3',    'Designkonzept',                      false],
    ['3.1',  'Visueller Stil & Stimmung',          true],
    ['3.2',  'Farbpalette',                        true],
    ['3.3',  'Spielerfigur: Sprites',              true],
    ['3.4',  'Hintergrund & Parallax',             true],
    ['3.5',  'Plattform-Design',                   true],
    ['3.6',  'UI & HUD',                           true],
    ['3.7',  'Animationssystem',                   true],
    ['3.8',  'Audio-Konzept',                      true],
    ['3.9',  'Typografie',                         true],
  ].map(([nr, title, indent]) => new Paragraph({
    spacing: { after: 60, line: SPACING, lineRule: 'auto' },
    indent: { left: indent ? 360 : 0 },
    children: [
      new TextRun({ text: `${nr}  `, bold: !indent, font: FONT, size: FS_BODY, color: '2C4770' }),
      new TextRun({ text: title, bold: !indent, font: FONT, size: FS_BODY }),
    ]
  })),
  pb(),

  // ══════════════════════════════════════════════════════════════════
  // 1. GROBKONZEPT
  // ══════════════════════════════════════════════════════════════════
  h1('1  Grobkonzept'),

  h2('1.1  Projektübersicht'),
  infoTable([
    ['Projekttitel (intern)',  'Soggy Moggy'],
    ['Spieltitel (im Spiel)', 'Gato Sin Botas'],
    ['Genre',                 'Casual Vertical Platformer'],
    ['Plattform',             'Web-Browser (HTML5, kein Plugin erforderlich)'],
    ['Auflösung',             '480 x 640 Pixel, Hochformat (Portrait)'],
    ['Spielsprache',          'Spanisch (alle UI-Texte und HUD-Labels)'],
    ['Rahmenthema',           '3 — Casual Webgame "Plush Toy Combat"'],
    ['Ziel-Altersfreigabe',   'USK 0'],
    ['Technologie',           'Vanilla JavaScript ES2022+ + HTML Canvas 2D, keine Frameworks'],
    ['Hosting',               'GitHub Pages'],
  ]),
  gap(),

  h2('1.2  Spielidee & Kernaussage'),
  body('Gato Sin Botas ist ein vertikaler Plattformer. Der Spieler steuert eine ausgestopfte Katze, die vor einer stetig steigenden Flut nach oben flieht. Anders als in klassischen Endlos-Springern wie Doodle Jump springt die Figur nicht automatisch, sondern nur auf direkte Eingabe des Spielers.'),
  body('Diese Entscheidung macht jeden Sprung zu einem bewussten Akt und gibt dem Spieler vollständige Kontrolle über das Timing. Das Spiel ist in drei eigenständige Level unterteilt, jedes mit eigenem visuellem Thema und eigener Kernmechanik. Die Atmosphäre folgt dem Prinzip Cozy Danger: Die Welt wirkt warm und verspielt, die steigende Gefahr erzeugt aber kontinuierlich wachsenden Druck.'),
  gap(),

  h2('1.3  Zielgruppe'),
  infoTable([
    ['Primäre Zielgruppe',   'Casual-Gamer, 12 bis 30 Jahre, Vorerfahrung mit Plattformern'],
    ['Sekundäre Zielgruppe', 'Kurzzeit-Spieler mit Mobile-Mindset, kurze klare Sessions bevorzugt'],
    ['Spielmotivation',      'Überleben, Highscore verbessern, alle drei Level abschließen'],
    ['Session-Länge',        'Durchschnittlich 3 bis 8 Minuten pro Level'],
  ]),
  gap(),

  h2('1.4  Einzigartiges Merkmal (USP)'),
  tableN(
    ['Merkmal', 'Kategorie', 'Beschreibung'],
    [
      ['Manueller Sprung',        'Mechanik',  'Keine Automatik; volle Kontrolle über Timing und Rhythmus'],
      ['Plüschtier als Held',     'Ästhetik',  'Figurdesign als Kuscheltier; Kontrast zur Bedrohung durch die Flut'],
      ['Spanischsprachige UI',    'Identität', 'Alle UI-Texte auf Spanisch als bewusstes Stilmittel'],
      ['Drei eigenständige Level','Struktur',   'Je eigenes Thema und Gefahr, kein Endlos-Modus'],
      ['Push-Mechanik',           'Mechanik',  'Schieben von Objekten als aktives Werkzeug auf Plattformen'],
    ],
    [1600, 1400, 4937]
  ),
  gap(),

  h2('1.5  Plattform & Technologie'),
  body('Das Spiel läuft vollständig im Browser ohne externe Plug-ins, Frameworks oder Build-Tools.'),
  tableN(
    ['Komponente', 'Technologie', 'Begründung'],
    [
      ['Rendering',  'HTML Canvas 2D API',          'Direktes Pixel-Rendering, imageSmoothingEnabled = false'],
      ['Logik',      'Vanilla JavaScript ES2022+',  'Kein Framework-Overhead, vollständige Kontrolle über Spielzustand'],
      ['Physik',     'Eigenimplementierung',         'Semi-fixes Zeitschritt-Modell, 50ms Delta-Cap gegen Physikfehler'],
      ['Audio',      'Web Audio API',                'Plattform-nativ, kein externer Asset-Loader nötig'],
      ['Hosting',    'GitHub Pages',                 'Kostenlos, direkt aus dem Repository deployt'],
    ],
    [1400, 2100, 4437]
  ),
  gap(),

  h2('1.6  Levelübersicht'),
  tableN(
    ['#', 'Titel', 'Setting', 'Besondere Gefahr'],
    [
      ['1', 'La Ciudad',         'Stadtgebäude, Jalousien als Plattformen', 'Steigender Smog'],
      ['2', 'El Mar Abierto',    'Offener See, Masten mit Stegen',          'Steigende Flut (Sinuswelle)'],
      ['3', 'El Pozo Eléctrico', 'Aufzugschacht, Betonwände, Kabel',       'Steigende Elektrizität (3-Schicht-Blitze)'],
    ],
    [500, 1700, 2600, 3137]
  ),
  pb(),

  // ══════════════════════════════════════════════════════════════════
  // 2. FEINKONZEPT
  // ══════════════════════════════════════════════════════════════════
  h1('2  Feinkonzept'),

  h2('2.1  Spielzustände & Spielfluss'),
  body('Das Spiel basiert auf einer Zustandsmaschine mit fünf klar definierten Zuständen. Übergänge erfolgen durch Spielereingabe und sind vollständig reversibel, ohne Seitenreload.'),
  tableN(
    ['Zustand', 'Beschreibung', 'Übergang zu'],
    [
      ['start',          'Startbildschirm. Spieltitel, Steuerungshinweise, Startaufforderung.',   'playing bei Leertaste oder Mausklick'],
      ['playing',        'Vollständige Spiellogik aktiv. HUD sichtbar. Alle Mechaniken laufen.',  'paused bei ESC; level_complete bei Ziellinie; gameover bei Tod'],
      ['paused',         'Spiellogik pausiert. Pause-Menü mit vier Optionen sichtbar.',            'playing (Fortsetzen) oder andere Zustände per Menüauswahl'],
      ['level_complete', 'Level abgeschlossen. Score-Anzeige und vier Optionen für den weiteren Spielverlauf.', 'playing (nächstes Level), playing (Neustart), start (Hauptmenü)'],
      ['gameover',       'Zeigt aktuellen Score und Highscore. Neustart-Option.',                  'playing bei Leertaste oder Mausklick'],
    ],
    [1600, 3400, 2937]
  ),
  gap(),

  h2('2.2  Steuerung'),
  body('Das Spiel unterstützt Tastatur und Maus gleichwertig. Es gibt keine diagonale Eingabe.'),
  tableN(
    ['Aktion', 'Tastatur', 'Maus'],
    [
      ['Links bewegen',  'A oder Pfeiltaste Links',  'nicht belegt'],
      ['Rechts bewegen', 'D oder Pfeiltaste Rechts', 'nicht belegt'],
      ['Springen',       'Leertaste',                'Linksklick'],
      ['Push (Aktion)',  'Z',                        'Rechtsklick'],
    ],
    [2200, 2500, 3237]
  ),
  gap(),

  h2('2.3  Spielerfigur'),
  body('Die Spielerfigur ist eine ausgestopfte Katze, kein realistisches Tier. Das Plüschtier-Design ist bewusstes Stilmittel: weiche Formen und Knopfaugen kontrastieren mit der Bedrohung durch die Flut.'),
  infoTable([
    ['Hitbox',             '32 x 32 Pixel (Welt-Koordinaten)'],
    ['Darstellungsgröße',  '96 x 96 Pixel (1,5-fache Skalierung, Quell-Sprite 64px)'],
    ['Ausrichtung',        'Horizontal gespiegelt bei Richtungswechsel via ctx.scale(-1, 1)'],
    ['Ankerpunkt',         'Unterkante der Hitbox bündig mit Plattformoberfläche'],
    ['Sprite-Set',         '7 Sprites: idle, walk_1, walk_2, rise, peak, push_rise, push_peak'],
  ]),
  gap(),

  h2('2.4  Bewegung & Sprung'),
  body('Die Physik basiert auf einem semi-fixen Zeitschritt. Alle Geschwindigkeitswerte sind in Pixel pro Sekunde angegeben und werden mit dt / 1000 pro Frame skaliert. Ein Delta-Cap von 50 Millisekunden verhindert Physikfehler bei Tab-Wechsel.'),
  body('Der Sprung ist manuell: Er wird nur ausgelöst, wenn player.onGround den Wert true hat. Die Variable wird am Anfang jeder Kollisionsprüfung auf false zurückgesetzt und nur bei erfolgreicher Landung wieder gesetzt.'),
  body('Der Sprung ist variabel: Ein kurzer Tastendruck oder kurzer Klick erzeugt einen kleinen Hüpfer (Mindestimpuls -523 px/s, etwa 139 px Höhe). Langes Halten der Taste fügt innerhalb eines 200ms-Boostfensters weiteren Aufwärtsimpuls hinzu (905 px/s² Boost) und erreicht maximal -704 px/s (ca. 253 px Höhe). Ein jumpLocked-Flag verhindert einen erneuten Sprung, solange die Taste nach der Landung noch gehalten wird.'),
  body('Das Kollisionsmodell ist eine One-Way-AABB-Kollision. Eine Plattform stoppt die Figur nur bei gleichzeitig erfüllten drei Bedingungen: horizontale Überlappung, Spieler war im Vorframe oberhalb der Plattform, und Spieler bewegt sich aktuell nach unten. Bei Landung wird vy auf 0 gesetzt.'),
  gap(),

  h2('2.5  Push-Mechanik'),
  body('Die Push-Mechanik wird in Phase 5 vollständig implementiert. Taste Z oder Rechtsklick schiebt Objekte auf Plattformen. Es gibt mehrere Objekttypen: Score-Objekte (Punkte), Bonus-Objekte (zeitlimitierte Effekte) und kulturelle Objekte (lateinamerikanische Elemente). Während der Push-Aktion wechselt der Sprite auf push_rise am Boden oder push_peak in der Luft. Balancing-Werte werden in Phase 5 festgelegt.'),
  gap(),

  h2('2.6  Plattformtypen'),
  tableN(
    ['Typ', 'Verhalten', 'Visuell'],
    [
      ['Normal',  'Stabil und dauerhaft vorhanden.',                        'Levelthema-Sprite (z.B. Jalousie in Level 1)'],
      ['Brüchig', 'Bröckelt nach Landung, verschwindet nach kurzer Zeit.',  'Rissig gelb (Zeile 4), dann zerbröckelnd gelb (Zeile 4)'],
    ],
    [1400, 3000, 3537]
  ),
  body('Plattformen werden prozedural generiert. Mindest- und Maximalabstand begrenzen den spielbaren Sprungbereich. Jede Plattform wird dreiteilig gerendert: linke Kappe, gekachelte Mitte, rechte Kappe.'),
  gap(),

  h2('2.7  Gefahren-Mechanik (Hazard)'),
  body('Jedes Level hat eine eigene, stetig steigende Gefahr. Alle drei Gefahren teilen dieselbe Physik (Anstiegsgeschwindigkeit, Beschleunigung, Kollisionserkennung), unterscheiden sich aber visuell. Kontakt mit der Gefahr kostet ein Leben. Die Gefahr existiert in Weltkoordinaten und folgt dem gleichen Koordinatensystem wie alle anderen Spielentitäten.'),
  body('Level 1 (Smog): Geschichtete Gradientenbänder mit Kosinus-Wölbung am oberen Rand und Glüheffekt. Level 2 (Flut): Sinuswellen-Animation in WATER-1 (#2a5fa8). Level 3 (Elektrizität): Drei unabhängige Blitzschichten mit unterschiedlichen Frequenzen, Ankerpunkten und pulsierender Transparenz.'),
  gap(),

  h2('2.8  Leben & Scheitern'),
  infoTable([
    ['Start-Leben',  '3 Leben, dargestellt als Herz-Icons oben links im HUD'],
    ['Lebensverlust','Kontakt mit Flut oder Herunterfallen unter den Bildschirmrand'],
    ['Game Over',    'Bei 0 Leben; direkte Game-Over-Einblendung ohne Respawn'],
    ['Neustart',     'Vollständiger Neustart über Zustandsmaschine, kein Seitenreload'],
  ]),
  gap(),

  h2('2.9  Punkte & Highscore'),
  body('Der Score entspricht der zurückgelegten Höhe in Weltkoordinaten über dem Startpunkt. Die Berechnung erfolgt pro Frame: score = max(0, spawnY minus player.y). Der Highscore wird lokal im Browser über LocalStorage gespeichert und auf dem Game-Over-Screen angezeigt.'),
  gap(),

  h2('2.10  Kamera & Weltkoordinaten'),
  body('Alle Spielentitäten existieren in Weltkoordinaten. Die Kamera wird durch ein einmaliges ctx.translate(0, -cameraY) vor dem Render aller Weltobjekte umgesetzt. Das HUD wird nach ctx.restore() gezeichnet und bleibt damit stets in Bildschirmkoordinaten. Die Kamera folgt dem Spieler nach oben, scrollt aber nicht nach unten unter den Ausgangspunkt.'),
  gap(),

  h2('2.11  Gefahren pro Level'),
  tableN(
    ['Level', 'Titel', 'Gefahrentyp', 'Beschreibung'],
    [
      ['1', 'La Ciudad',         'Steigender Smog',       'Geschichtete Gradientenbänder mit Kosinus-Wölbung; steigt kontinuierlich'],
      ['2', 'El Mar Abierto',    'Steigende Flut',        'Sinuswellen-Animation; Flutstieg schneller als Level 1'],
      ['3', 'El Pozo Eléctrico', 'Steigende Elektrizität','3-Schicht-Blitze mit unabhängigen Frequenzen und pulsierender Transparenz'],
    ],
    [500, 1700, 1500, 4237]
  ),
  pb(),

  // ══════════════════════════════════════════════════════════════════
  // 3. DESIGNKONZEPT
  // ══════════════════════════════════════════════════════════════════
  h1('3  Designkonzept'),

  h2('3.1  Visueller Stil & Stimmung'),
  body('Das Spiel folgt dem Prinzip Cozy Danger. Figur und Spielwelt wirken weich, warm und einladend, geprägt durch Pixel Art mit satten Farben und weichen Formen. Die steigende Flut erzeugt wachsenden Druck, ohne die Stimmung in Richtung Horror zu kippen.'),
  infoTable([
    ['Stil',              'Pixel Art, 64px-Basis für Spielerfigur-Sprites'],
    ['Outlines',          'Keine schwarzen Outlines; Kontrast ausschließlich durch Farbabstufungen'],
    ['Pixel-Rendering',   'imageSmoothingEnabled = false an allen Stellen im Rendercode'],
    ['Figur-Proportionen','Übergroßer Kopf (ca. 40 % der Gesamtgröße), weiche Körperformen'],
    ['Verboten',          'Antialiasing, CSS-Effekte auf Canvas, Fonts mit Blur oder Shadow'],
  ]),
  gap(),

  h2('3.2  Farbpalette'),
  body('Die Palette ist auf exakt 16 Farben festgelegt und gilt für das gesamte Spiel. Kein reines Schwarz (#000000) als Outline-Farbe.'),
  tableN(
    ['Code', 'Hex', 'Verwendung'],
    [
      ['BG-1',    '#7eb8c9', 'Taghimmel, Hintergrundebene 1'],
      ['BG-2',    '#2e3a5c', 'Nachthimmel, Hintergrundebene 2'],
      ['BG-3',    '#1a2438', 'Tiefer Nachthimmel'],
      ['BG-4',    '#c8e8f0', 'Heller Himmelstreifen, Horizontlicht'],
      ['PLAT-1',  '#5a7a3a', 'Plattform-Grundfarbe'],
      ['PLAT-2',  '#3d5228', 'Plattform-Schatten'],
      ['PLAT-3',  '#8ab04a', 'Plattform-Highlight'],
      ['WATER-1', '#2a5fa8', 'Flut-Hauptfarbe'],
      ['WATER-2', '#4a8fd8', 'Flut-Wellenkamm'],
      ['WATER-3', '#1a3f78', 'Flut-Tiefe'],
      ['CAT-1',   '#b09070', 'Katzenkörper (Plüschbeige)'],
      ['CAT-2',   '#d4b896', 'Katze-Highlight'],
      ['CAT-3',   '#7a6050', 'Katze-Schatten'],
      ['CAT-4',   '#2a2020', 'Knopfaugen (dunkelbraun, kein reines Schwarz)'],
      ['UI-1',    '#f5e6c8', 'UI-Hintergrund, Textfelder'],
      ['UI-2',    '#c87820', 'UI-Akzent, Rahmenfarbe'],
    ],
    [1100, 1300, 5537]
  ),
  gap(),

  h2('3.3  Spielerfigur: Sprites'),
  body('Die ausgestopfte Katze ist anatomisch als Plüschtier gestaltet: Knopfaugen in CAT-4, sichtbare Nähte in CAT-3, kein Mund, übergroßer Kopf. Sprite-Wechsel erfolgen als harte Cuts ohne Tweening.'),
  tableN(
    ['Sprite', 'Datei', 'Auslösebedingung'],
    [
      ['idle',      'cat/idle.png',      'Am Boden, keine Horizontalbewegung'],
      ['walk_1',    'cat/walk_1.png',    'Am Boden, Bewegung, gerader 150ms-Frame'],
      ['walk_2',    'cat/walk_2.png',    'Am Boden, Bewegung, ungerader 150ms-Frame'],
      ['rise',      'cat/rise.png',      'Aufsteigend nach Sprung (bounceTimer aktiv)'],
      ['peak',      'cat/peak.png',      'Höhepunkt der Flugbahn oder freier Fall'],
      ['push_rise', 'cat/push_rise.png', 'Push am Boden oder kurz nach Sprung'],
      ['push_peak', 'cat/push_peak.png', 'Push auf Höhepunkt der Flugbahn'],
    ],
    [1200, 2200, 4537]
  ),
  gap(),

  h2('3.4  Hintergrund & Parallax'),
  body('Das Hintergrundsystem besteht aus fünf Ebenen mit unterschiedlichen Parallax-Geschwindigkeiten. Ein gradueller Tag-zu-Nacht-Übergang ist an die Spielhöhe gekoppelt (Variable t, 0 = Boden, 1 = Levelziel).'),
  tableN(
    ['Ebene', 'Asset', 'Faktor', 'Beschreibung'],
    [
      ['1', 'sky_day.png',       '0,30x', 'Taghimmel BG-1, verblasst mit steigender Höhe'],
      ['2', 'sky_night.png',     '0,30x', 'Nachthimmel BG-2, crossfadet mit Höhe rein'],
      ['3', 'stars.png',         '0,10x', 'Sterne, Einblendung ab t=0,3, voll sichtbar ab t=0,7'],
      ['4', 'clouds_bright.png', '0,60x', 'Helle Wolken, horizontaler Drift 15 px/s'],
      ['5', 'clouds_dark.png',   '0,60x', 'Dunkle Wolken, langsamerer Drift'],
    ],
    [500, 2100, 900, 4437]
  ),
  gap(),

  h2('3.5  Plattform-Design'),
  body('Level 1 nutzt ein Jalousien-Sprite-Sheet mit 7 Zeilen. Fünf intakte Zustände werden bei der Plattformgenerierung zufällig zugewiesen. Zeile 4 zeigt sowohl die gerissene als auch die zerbröckelnde Variante in Gelb. Jede Plattform wird dreiteilig gerendert: linke Kappe, gekachelte Mitte, rechte Kappe.'),
  body('Plattform-Designs für Level 2 und 3 werden in der zugehörigen Pixelart-Phase erstellt und folgen demselben dreiteiligen Muster.'),
  gap(),

  h2('3.6  UI & HUD'),
  body('Alle UI-Texte sind auf Spanisch. HUD-Elemente werden nach ctx.restore() in Bildschirmkoordinaten gezeichnet und sind damit kamerapositions-unabhängig.'),
  tableN(
    ['Screen', 'Titel / Text (Spanisch)', 'Inhalt'],
    [
      ['Start',          '"Presiona ESPACIO para jugar"',  'Spieltitel, Steuerungsübersicht, Startaufforderung'],
      ['HUD',            'Leben-Icons + Höhen-Score',       'Herz-Icons oben links, Score-Wert oben rechts'],
      ['Pause',          '"Pausa" (ESC-Menü)',              '4 Optionen: Continuar / Reiniciar nivel / Reiniciar juego / Menú principal'],
      ['Level Complete', '"Nivel Completado"',              '4 Optionen: Siguiente nivel / Reiniciar nivel / Reiniciar juego / Menú principal'],
      ['Game Over',      '"Fin del Juego"',                 'Aktueller Score, Highscore, Neustart-Hinweis'],
    ],
    [1400, 2500, 4037]
  ),
  gap(),

  h2('3.7  Animationssystem'),
  body('Das Animationssystem ist vollständig frame-basiert ohne externe Bibliothek. Sprite-Wechsel erfolgen als harte Cuts, kein Tweening oder Blending. Dies entspricht dem Pixel-Art-Stil.'),
  infoTable([
    ['Laufzyklus',       '2 Frames (walk_1, walk_2); Wechsel alle 150ms via performance.now()'],
    ['BounceTimer',      '240ms nach Sprung aktiv; verhindert sofortigen Sprite-Wechsel zu idle'],
    ['PushTimer',        'Aktiv solange Push-Aktion läuft; überschreibt Bewegungs-Sprites'],
    ['Sprite-Priorität', 'pushTimer > Boden+Bewegung > Boden+Stand > Aufstieg > Höhepunkt > Fall'],
  ]),
  gap(),

  h2('3.8  Audio-Konzept'),
  body('Alle Sounds werden über die Web Audio API erzeugt oder abgespielt. Vollimplementierung in Phase 5. Kein aggressives oder erschreckendes Audiomaterial; alle Sounds unterstützen die Cozy-Danger-Stimmung.'),
  tableN(
    ['Event', 'Typ', 'Stilbeschreibung'],
    [
      ['Sprung',           'Kurzton', 'Federndes, leicht quietschendes Geräusch passend zum Plüschtier'],
      ['Landung',          'Kurzton', 'Dumpfes, weiches Aufsetzen'],
      ['Push',             'Kurzton', 'Schiebegeräusch passend zur Figur'],
      ['Gefahr steigt',    'Loop',    'Levelspezifisch (Wasser/Smog/Strom); Lautstärke wächst mit Pegel'],
      ['Leben verloren',   'Effekt',  'Kurzes komisches Geräusch ohne Horror-Charakter'],
      ['Game Over',        'Sequenz', 'Kurze Abschluss-Melodie, ruhig auslaufend'],
      ['Hintergrundmusik', 'Loop',    'Levelspezifisch, ambient und locker'],
    ],
    [1700, 1100, 5137]
  ),
  gap(),

  h2('3.9  Typografie'),
  body('Maximal zwei Schriftgrößen pro Screen. Alle Texte linksbündig oder zentriert, kein Flattersatz rechts.'),
  tableN(
    ['Verwendung', 'Schriftart', 'Größe / Stil'],
    [
      ['HUD-Labels und Score', 'Arial',        '16 bis 18 px, normal'],
      ['Spieltitel Start',     'Arial',        '32 bis 40 px, fett'],
      ['Hinweistexte',         'Arial',        '14 px, normal'],
      ['Textfarbe',            'UI-1 #f5e6c8', 'Auf dunklem oder transparentem Hintergrund'],
    ],
    [2300, 1700, 3937]
  ),
];
ACTIVE_CW = CONTENT_W;

const gddDoc = new Document({
  numbering: {
    config: [{
      reference: 'gdd-bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
    }]
  },
  styles: { default: { document: { run: { font: FONT, size: FS_BODY } } } },
  sections: [section(gddContent, { left: GDD_M_LEFT, right: GDD_M_RIGHT, header: 708, footer: 708 })]
});

// ── Write output ────────────────────────────────────────────────────────────
const OUT = __dirname;

Promise.allSettled([
  Packer.toBuffer(projektplanDoc).then(b => {
    fs.writeFileSync(`${OUT}/Projektplan_Julian_Gomez.docx`, b);
    console.log('OK  Projektplan_Julian_Gomez.docx');
  }),
  Packer.toBuffer(arbeitsprotokollDoc).then(b => {
    fs.writeFileSync(`${OUT}/Arbeitsprotokoll_Julian_Gomez.docx`, b);
    console.log('OK  Arbeitsprotokoll_Julian_Gomez.docx');
  }),
  Packer.toBuffer(gddDoc).then(b => {
    fs.writeFileSync(`${OUT}/GDD_Julian_Gomez.docx`, b);
    console.log('OK  GDD_Julian_Gomez.docx');
  }),
]).then(results => {
  results.forEach(r => { if (r.status === 'rejected') console.error('FAILED:', r.reason.message); });
  if (results.some(r => r.status === 'rejected')) process.exit(1);
});
