// create_docs.js — Projektplan + Arbeitsprotokoll for Soggy Moggy
// Run: node create_docs.js

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber
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
    spacing: { before: 200, after: 160, line: SPACING, lineRule: 'auto' },
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

// ── Section wrapper ────────────────────────────────────────────────────────
function section(children) {
  return {
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: M_TOP, right: M_RIGHT, bottom: M_BOTT, left: M_LEFT }
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
        tabStops: [{ type: 'right', position: CONTENT_W }]
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

// ── Write output ────────────────────────────────────────────────────────────
const OUT = __dirname;

Promise.all([
  Packer.toBuffer(projektplanDoc).then(b => {
    fs.writeFileSync(`${OUT}/Projektplan_Julian_Gomez.docx`, b);
    console.log('OK  Projektplan_Julian_Gomez.docx');
  }),
  Packer.toBuffer(arbeitsprotokollDoc).then(b => {
    fs.writeFileSync(`${OUT}/Arbeitsprotokoll_Julian_Gomez.docx`, b);
    console.log('OK  Arbeitsprotokoll_Julian_Gomez.docx');
  }),
]).catch(e => { console.error('FAILED:', e.message); process.exit(1); });
