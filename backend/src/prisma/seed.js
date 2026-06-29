// Seed: Phasen & Checklisten — allkauf-Ausbauhaus, abgeglichen mit der offiziellen
// allkauf-Baubeschreibung (Stand 06/2025) und der allkauf-FAQ.
// + zwei Nutzer-Accounts (Abschnitt 8) + experimentelles Haus-Modul.
//
// Beträge, Stunden und Termine sind bewusst LEER (Platzhalter) — bitte mit dem konkreten
// Vertrag/Bemusterungsprotokoll/Bauzeitenplan füllen. Fakten/Hinweise stehen in den Beschreibungen.
//
// Idempotent: legt fehlende Daten an, lässt vorhandene unverändert.

import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { config } from '../config/env.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const d = (s) => (s ? new Date(`${s}T00:00:00.000Z`) : null);

const CAT = {
  paket: 'allkauf_paket', // allkauf-Grundpreis (Festpreis, als Pauschale)
  bem: 'bemusterung_extra', // Bemusterungs-Aufpreise / Zusatzleistungen
  eigen: 'eigenleistung_material', // selbst gekauftes Material
  sonst: 'sonstiges', // Baunebenkosten (Vermessung, Bodenplatte, Hausanschlüsse, ...)
};

// O = offizieller allkauf-/Baubeschreibungs-Punkt (Baseline, nicht löschbar)
// S = ergänzende Empfehlung (is_custom = true, optional/löschbar)
const O = (title, extra = {}) => ({ title, isCustom: false, ...extra });
const S = (title, extra = {}) => ({ title, isCustom: true, ...extra });

const PHASES = [
  {
    orderNumber: 0,
    title: 'Phase 0 — Vorbereitung & Vertrag',
    description: 'Grundstück, Finanzierung, Hausmodell, Ausbaupakete, Werkvertrag.',
    lumpSums: [],
    tasks: [
      O('Grundstück gekauft / gesichert'),
      O('Bodengutachten beauftragt', {
        description: 'Bauherrenleistung — nicht im allkauf-Preis. Das Baugrundrisiko trägt der Bauherr.',
      }),
      O('Geprüft: Schutzgebiet (z. B. Wasserschutz), Auflagen vom Bauamt, Altlasten/Kampfmittel'),
      O('Finanzierung grundsätzlich geklärt (Vorab-Zusage)'),
      O('Hausmodell & Grundriss-Variante ausgewählt'),
      O('Ausbaupakete gewählt', {
        description: 'AP 1a (Trockenausbau-Material), AP 1b (Heizung/Split-LWWP, FBH, KWL-Lüftung, Rohrleitungen), AP 2 (Sanitärobjekte, Fliesen, Innentüren, Bodenbeläge, Fensterbänke, Tapeten).',
      }),
      O('Musterhaus besichtigt (allkauf: über 30 Standorte)'),
      O('Versicherungspaket-Wahl getroffen', {
        description:
          'allkauf bietet (Wahlrecht): Bauherrenhaftpflicht (4 Mon. vor bis 1 J. nach Stelltermin), Wohngebäude inkl. Feuerrohbauversicherung (ab Stelltermin), Bauleistungsversicherung (bis Abnahme), Einkommensschutz/ALV-plus.',
      }),
      O('Werkvertrag (vorbehaltsfreier Verbraucherbauvertrag) geprüft & unterschrieben'),
      S('KfW/BEG-Förderung VOR Vertragsabschluss prüfen & Energieeffizienz-Experten (EEE) einbinden', {
        priority: 'high',
        description: 'Programme 297/298 verfallen bei nachträglicher Beantragung (auch Lieferverträge zählen als Vorhabenbeginn).',
      }),
      S('Eigenleistung realistisch eingeschätzt', {
        description: 'allkauf: Einsparung bis ~30.000 € möglich; Eigenleistung wird von Banken als Eigenkapital gewertet.',
      }),
      S('Risikolebens-/BU-Versicherung für Kreditnehmer geprüft'),
      S('Erwerbsnebenkosten: Grunderwerbsteuer', { costCategory: CAT.sonst }),
      S('Erwerbsnebenkosten: Notar & Grundbucheintrag', { costCategory: CAT.sonst }),
      S('Maklerprovision (falls angefallen)', { costCategory: CAT.sonst }),
    ],
  },
  {
    orderNumber: 1,
    title: 'Phase 1 — Planung & Bemusterung',
    description: 'Architektengespräch, Grundriss, Statik, Bemusterung (Heinsberg), Eigenleistungs-Umfang.',
    lumpSums: [],
    tasks: [
      O('Vermesser beauftragt', {
        costCategory: CAT.sonst,
        description: 'Vermessungsleistungen sind NICHT im allkauf-Preis — gegen Aufpreis über allkauf/Architekt (Lageplan, Grobabsteckung, Feineinmessung, Schnurgerüst).',
      }),
      O('Bauantragsgespräch mit allkauf-Architekt', {
        description: 'Architektenleistung inkl. (Grundlagenermittlung, Festlegung Gebäudelage, individuelle Grundriss-Anpassung, Bauantragsplanung, gesetzliche Bauleitung). Baunebenkosten des Architekten sind inklusive.',
      }),
      O('Grundriss finalisiert, Sonderwünsche besprochen', {
        description: 'Einmalige Planungsänderungspauschale 1.999 € ermöglicht Fenster-/Wand-Änderungen; danach sind Änderungen nicht-tragender Wände kostenfrei (tragende Wände gegen Aufpreis per Stahlträger).',
      }),
      O('Statik durch allkauf erstellt', {
        description: 'Prüffähige Statik ab OK Bodenplatte/Kellerdecke ist inklusive. Prüfstatik (falls behördlich gefordert) trägt der Bauherr.',
      }),
      O('Bemusterung im allkauf-Bemusterungszentrum Heinsberg wahrgenommen', {
        description: 'Ca. 2 Tage, Übernachtung auf allkauf-Kosten. Bemustert wird AP 2: Sanitärobjekte & Armaturen, Fliesen, Fensterbänke, Innentüren, Bodenbeläge, Tapeten & Farbe. (Dachform, Fassade, Fenster, Heizung werden im Planungsgespräch festgelegt, nicht in der Bemusterung.)',
      }),
      O('Bemusterungsprotokoll & Änderungskosten geprüft und unterschrieben', {
        description: 'Entfallene Posten werden nur verrechnet, nicht ausgezahlt.',
      }),
      O('Eigenleistungs-/Dienstleistungs-Umfang festgelegt (selbst vs. allkauf)', {
        description: 'Optionale Dienstleistungspakete: Pro Time (Elektro+HLS), Active Time (+Estrich), Free Time (+Trockenbau+Spachteln, Koordination durch Partnerfirma).',
      }),
      S('Elektro-/Smart-Home-Planung fixiert', {
        priority: 'high',
        description: 'Standard ca. 130 Steckdosen; Sanitär/Elektro in der Ausbauphase jederzeit anpassbar. myGEKKO 3.0 optional; Leerrohre für PV/Wallbox/Speicher mitdenken.',
      }),
      S('Lüftungs-/Heizkonzept geklärt (KWL mit Wärmerückgewinnung; LWWP Standard Elco Split)'),
      S('Bemusterung: Aufpreis-Posten (Upgrades Fliesen/Bäder/Böden)', { costCategory: CAT.bem }),
      S('Markenküche (optional über allkauf)', { costCategory: CAT.bem }),
      S('Optionale Zusatzleistungen (Garage/Carport, PV-Anlage, Kingfire-Kamin, Klimaanlage, Garten-Paket)', { costCategory: CAT.bem }),
    ],
  },
  {
    orderNumber: 2,
    title: 'Phase 2 — Genehmigung & Baustellenvorbereitung',
    description: 'Bauantrag, Baugenehmigung, Bürgschaft, Hausanschlüsse, Baustelleneinrichtung.',
    lumpSums: [],
    tasks: [
      O('Bauantrag über allkauf-Architekt eingereicht', {
        description: 'Der Architekt liefert die Bauantragsunterlagen; der Bau- und Entwässerungsantrag ist vom Bauherrn zu unterschreiben und einzureichen.',
      }),
      O('Baugenehmigung erhalten / Baufreigabe'),
      O('Finanzierung final gesichert + Sicherheit/Bürgschaft vorgelegt', {
        description: 'Bürgschaft des Bauherrn (Hausvertragspreis zzgl. Nachträge) ist Voraussetzung (offizielle Phase 9).',
      }),
      O('Hausanschlüsse beantragt (Strom, Wasser, Abwasser, Telekom)', {
        costCategory: CAT.sonst,
        description: 'Antragsformulare besorgt der Bauherr; allkauf bereitet sie vor und liefert Lageplan/Bauzeichnungen für die Gewerke.',
      }),
      O('Baustelle vorbereitet (Zufahrt, Kranstellplatz, Baustrom, Bau-WC)', {
        priority: 'high',
        description: 'Zufahrt für 60-t-Schwerlast (3 m breit, 20 m lang, 4,50 m Durchfahrtshöhe), Kranstellplatz 8×12 m mit 2 m Freifläche, Baustrom 400 V/16 A (max. 25 m), Bau-Wasser, Bau-WC; Baustelle aufgeräumt & frei von Hindernissen zum Montagetermin.',
      }),
      S('SiGeKo bestellt (Sicherheits- & Gesundheitsschutzkoordinator)', {
        description: 'Pflicht nach §3 BaustellV, wenn mehrere Gewerke gleichzeitig tätig sind — nicht von allkauf übernommen.',
      }),
      S('Bauvorhaben bei der BG BAU angemeldet (Unfallversicherung der Bauhelfer)', { priority: 'high' }),
      S('Abfallcontainer organisiert (Bauschuttentsorgung nach Gewerbeabfallverordnung)', { costCategory: CAT.sonst }),
      S('Baustrom & Bauwasser (Provisorium)', { costCategory: CAT.sonst }),
      S('Versicherungspaket Bauzeit aktiviert (über allkauf oder extern)', { costCategory: CAT.sonst }),
    ],
  },
  {
    orderNumber: 3,
    title: 'Phase 3 — Bodenplatte/Keller & Hausmontage',
    description: 'Bodenplatte/Keller (Bauherrenleistung), Abnahme durch DFH-Bauleiter, Hausmontage.',
    lumpSums: [{ label: 'allkauf-Grundpreis (Hauslieferung + Montage + AP 1a/1b/2 + Architekt + Statik) — bitte eintragen', amount: 0 }],
    tasks: [
      O('Erdarbeiten / Aushub, Frostschürze, ggf. Schnurgerüst', {
        costCategory: CAT.sonst,
        description: 'Bauherrenleistung — nicht im allkauf-Preis.',
      }),
      O('Bodenplatte oder Keller erstellt', {
        costCategory: CAT.sonst,
        description: 'In Eigenleistung/Fremdfirma ODER gegen Aufpreis über allkauf. Erfolgt VOR der Montage (Liefervoraussetzung). Maßhaltigkeit ±1 cm; bei Eigenkeller Fachbauleitererklärung. Auf Beton kein Taumittel/Salz streuen.',
      }),
      O('Bodenplatte/Keller durch DFH-Bauleiter auf Maßhaltigkeit abgenommen', {
        description: 'Termin ca. 2 Wochen vorher mit dem DFH-Bauleiter vereinbaren.',
      }),
      O('Aushärtung der Bodenplatte abgewartet'),
      O('Montagetermin (Stelltermin) vergeben', {
        description: 'Stelltermin = 14 Wochen nach Erfüllung der Bau- & Liefervoraussetzungen (Baugenehmigung, Bodenplatte, Finanzierung/Bürgschaft, Bemusterung, Änderungskosten unterschrieben).',
      }),
      O('Hausmontage (Holzständer-Fertigteile)', {
        description: 'Aufbau i. d. R. in 1–3 Tagen. Kran >40 t / Sonderfahrten = Mehrkosten des Bauherrn.',
      }),
      O('Hausübergabe des Ausbauhauses', {
        description: 'Übergabe ab OK Bodenplatte/Kellerdecke, wind-/wetterdicht. Besprechung der Ausbaumaßnahmen mit der Bauleitung.',
      }),
      O('Außen- und Innenwände untermörteln + Deckendurchbrüche schließen', {
        description: 'Bauherrenleistung ab OK Kellerdecke/Bodenplatte; Quellmörtel wird von allkauf mitgeliefert.',
      }),
      S('Lieferung kontrolliert (Mengen-/Mängelkontrolle, sofort auf Lieferschein rügen)'),
      S('Bautagebuch / Fotodokumentation geführt'),
      S('Richtfest 🎉'),
    ],
  },
  {
    orderNumber: 4,
    title: 'Phase 4 — Innenausbau (Eigenleistung)',
    description: 'Offizieller allkauf-Ablauf der Gewerke (mit Richt-Dauern aus dem Bauzeitenplan).',
    lumpSums: [],
    tasks: [
      O('Elektro-Rohinstallation (ca. 3 Wochen)', { description: 'Leitungen, Dosen, Verteiler. Optional Dienstleistung Elektro.' }),
      O('Trockenbau / Beplankung (ca. 3 Wochen)', { description: 'Decken, Dachschrägen, Vorwände; Gipskartonplatten verspachteln.' }),
      O('Treppe EG/DG einbauen'),
      O('Heizung, Be-/Entlüftung (KWL) & Sanitär-Rohinstallation (ca. 3 Wochen)', {
        description: 'Fußbodenheizung verlegen; AP 1b (Split-LWWP, Lüftung mit Wärmerückgewinnung).',
      }),
      O('Medien anschlussfertig: Strom/Wasser/Telekom VOR dem Estrich', {
        priority: 'high',
        description: 'Müssen vor Estrich-Einbringung anschlussfertig gelegt sein — sonst verzögern sich alle Folgegewerke.',
        milestone: { title: 'Estrich fertig', daysBefore: 14 },
      }),
      O('Estrich (ca. 2 Wochen)', { description: 'Typischer relativer Meilenstein — siehe Wiedervorlagen.' }),
      O('Estrichtrocknung + Aufheizphase Fußbodenheizung (ca. 4 Wochen)', {
        description: 'Lüftung/Aufheizen durch den Bauherrn (Ausbau-/Pflegeanleitung). CM-Messung/Belegreife vor Bodenbelag.',
      }),
      O('Spachtelarbeiten + Inbetriebnahme Elektro & Heizung (ca. 2 Wochen)'),
      O('Fliesen (Bad, ggf. Küche)', { costCategory: CAT.eigen }),
      O('Bodenbeläge (Laminat/Parkett/Fliesen)', { costCategory: CAT.eigen, description: 'AP-2-Material; Standard Laminat + Fliesen 60×30, Upgrades möglich.' }),
      O('Innentüren einbauen'),
      O('Maler- & Tapezierarbeiten', { description: 'AP 2: Tapeten & Farbe.' }),
      O('Sanitärobjekte Endmontage'),
      O('Elektro-Endmontage (Schalter, Steckdosen, Leuchten)'),
      O('Küche einbauen', { costCategory: CAT.eigen, description: 'Markenküche optional über allkauf.' }),
      O('Außenputz (witterungsbedingt)', { description: 'Im allkauf-Umfang: mineralischer Außenputz weiß + Egalisierungsanstrich.' }),
      S('Klinkerfassade (falls gewählt) — Eigenleistung/Fremdfirma', {
        costCategory: CAT.sonst,
        description: 'NICHT über allkauf; Endputz entfällt wertneutral. Folie/Abdichtung am Fußpunkt beachten.',
      }),
      S('Luftdichtheitsmessung (Blower-Door) koordiniert', {
        description: 'allkauf führt die Luftdichtheitsmessung durch (EAN50 / externer Energieberater).',
      }),
      S('Eigenleistungshelfer bei der BG BAU angemeldet'),
      S('Material: Bodenbeläge (Platzhalter)', { costCategory: CAT.eigen }),
      S('Material: Wandfarbe / Tapeten (Platzhalter)', { costCategory: CAT.eigen }),
      S('Material: Fliesen (Platzhalter)', { costCategory: CAT.eigen }),
      S('Dienstleistungspaket (ProTime/ActiveTime/FreeTime), falls beauftragt', { costCategory: CAT.bem }),
    ],
  },
  {
    orderNumber: 5,
    title: 'Phase 5 — Abnahme & Einzug',
    description: 'Abnahme, Mängel, Schlussrechnung, Versicherungen, Umzug, Außenanlagen.',
    lumpSums: [],
    tasks: [
      O('Bauabnahme (Mängelprotokoll)'),
      O('Mängel beheben & nachkontrollieren'),
      O('Schlussrechnung prüfen & begleichen'),
      O('Versicherungen final', {
        description: 'Wohngebäudeversicherung inkl. Feuerrohbau läuft ab Stelltermin; Bauleistungsversicherung endet mit Abnahme des Gewerkes. Ggf. von Bauzeit auf Dauerbetrieb umstellen.',
      }),
      O('Zähler anmelden / Hausanschlüsse final'),
      O('Umzug'),
      O('Außenanlagen (Terrasse, Wege, Entwässerung, Garten)', {
        costCategory: CAT.eigen,
        description: 'NICHT im allkauf-Preis. Garten-Paket (Material) optional über allkauf.',
      }),
      S('Unabhängigen Sachverständigen zur Bauabnahme hinzugezogen', { priority: 'high', description: 'Nach Abnahme kehrt die Beweislast um.' }),
      S('Energieausweis (GEG) bzw. KfW „Bestätigung nach Durchführung" (BnD) durch EEE eingereicht', { priority: 'high' }),
      S('Hausnummer beantragt'),
      S('Ummeldung beim Einwohnermeldeamt (innerhalb 2 Wochen)'),
      S('Außenanlagen: Einfahrt/Zufahrt (Platzhalter)', { costCategory: CAT.eigen }),
      S('Puffer / Unvorhergesehenes (Platzhalter)', { costCategory: CAT.sonst }),
    ],
  },
  {
    orderNumber: 6,
    title: 'Phase 6 — Gewährleistung & nach dem Einzug',
    description: 'Die ersten 0–5 Jahre nach Abnahme.',
    lumpSums: [],
    tasks: [
      O('Gewährleistung & Bausicherheitspaket dokumentiert', {
        description: 'allkauf: 5 Jahre Gewährleistung nach BGB + Bausicherheitspaket (R+V). Alle Unterlagen (Pläne, Statik, Protokolle, Versicherungen, Wartungshefte) dauerhaft archivieren.',
      }),
      S('Mängel unverzüglich schriftlich rügen & Nachbesserungsfrist setzen', { priority: 'high' }),
      S('Hydraulischen Abgleich der Heizung durchführen (nach 1. Heizperiode)'),
      S('Gewährleistungsbegehung ~6 Monate vor Ablauf der 5-Jahres-Frist'),
      S('Wohngebäudeversicherung auf Elementarschadendeckung geprüft'),
      S('Jährliche Wartung (Wärmepumpe, KWL-Lüftung, Schornsteinfeger)'),
      S('Effektives Lüften beachtet (3× täglich Durchzug; Hygrometer 40–65 %)'),
    ],
  },
];

const MILESTONES = [
  { title: 'Bauantrag eingereicht', description: 'Über den allkauf-Architekten.', actualDate: null },
  { title: 'Baugenehmigung erhalten', description: 'Baufreigabe der Behörde.', actualDate: null },
  { title: 'Statik fertig', description: 'Prüffähige Statik durch allkauf.', actualDate: null },
  { title: 'Bemusterung', description: 'Bemusterungszentrum Heinsberg.', actualDate: null },
  { title: 'Abnahme Bodenplatte/Keller', description: 'Maßhaltigkeitsprüfung durch DFH-Bauleiter.', actualDate: null },
  { title: 'Hausmontage (Stelltermin)', description: '14 Wochen nach erfüllten Voraussetzungen.', actualDate: null },
  { title: 'Estrich fertig', description: 'Start der Trocknungszeit — relativer Meilenstein.', actualDate: null },
  { title: 'Hausübergabe', description: 'Übergabe des Ausbauhauses.', actualDate: null },
];

const HOUSE_AREAS = [
  { name: 'Familienbad', icon: '🛁', description: 'Wanne, Dusche, Doppelwaschtisch, Fliesen.' },
  { name: 'Gäste-WC', icon: '🚻', description: 'Kompakt, pflegeleicht.' },
  { name: 'Küche', icon: '🍳', description: 'Grundriss, Anschlüsse, Geräte, Bemusterung.' },
  { name: 'Wohn-/Esszimmer', icon: '🛋️', description: 'Bodenbelag, Licht, Steckdosen, Heizung.' },
  { name: 'Schlafzimmer', icon: '🛏️', description: 'Ankleide, Steckdosen, Licht.' },
  { name: 'Kinderzimmer', icon: '🧸', description: 'Flexible Nutzung, Netzwerk/Leerrohre.' },
  { name: 'Hauswirtschaftsraum (HWR)', icon: '🧺', description: 'Waschen, Trockner, Stauraum, Technik.' },
  { name: 'Technikraum', icon: '⚙️', description: 'Wärmepumpe, Verteiler, KWL, Wasser.' },
  { name: 'Flur / Diele', icon: '🚪', description: 'Garderobe, Beleuchtung, Bodenübergänge.' },
  { name: 'Garage / Carport', icon: '🚗', description: 'Stellplatz, Strom (Wallbox-Leerrohr!), Stauraum.' },
  { name: 'Garten / Außenanlage', icon: '🌳', description: 'Terrasse, Wege, Bepflanzung, Zaun.' },
  { name: 'Dachboden / Spitzboden', icon: '📦', description: 'Dämmung, Stauraum, evtl. späterer Ausbau.' },
];

async function ensureUser(u, idx) {
  if (!u.email) return;
  const email = String(u.email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] User ${email} existiert bereits — unverändert.`);
    return;
  }
  let pw = u.password;
  if (!pw) {
    pw = crypto.randomBytes(9).toString('base64url');
    console.warn(`[seed] WARNUNG: Kein Passwort für ${email} gesetzt. Temporäres Passwort: ${pw}  (bitte ändern via 'npm run reset-password')`);
  }
  const passwordHash = await bcrypt.hash(pw, 10);
  await prisma.user.create({
    data: { name: u.name || `Nutzer ${idx + 1}`, email, passwordHash, role: idx === 0 ? 'admin' : 'user' },
  });
  console.log(`[seed] User ${email} angelegt.`);
}

async function ensureSettings() {
  const existing = await prisma.projectSettings.findFirst();
  if (existing) return;
  // Bewusst leer (Modell/Größe/Budget/Termine/Stundensatz): vom Bauherrn zu füllen.
  await prisma.projectSettings.create({ data: {} });
  console.log('[seed] Projekt-Einstellungen (leer) angelegt.');
}

async function ensureTask(phaseId, t) {
  const existing = await prisma.task.findFirst({ where: { phaseId, title: t.title } });
  if (existing) return existing;
  return prisma.task.create({
    data: {
      phaseId,
      title: t.title,
      description: t.description || null,
      isCustom: Boolean(t.isCustom),
      costCategory: t.costCategory || null,
      costAmount: t.costAmount ?? null,
      plannedAmount: t.plannedAmount ?? null,
      estimatedHours: t.estimatedHours ?? null,
      priority: t.priority || 'normal',
      vendor: t.vendor || null,
    },
  });
}

async function ensureLumpSum(phaseId, l) {
  const existing = await prisma.phaseLumpSum.findFirst({ where: { phaseId, label: l.label } });
  if (existing) return existing;
  return prisma.phaseLumpSum.create({ data: { phaseId, label: l.label, amount: l.amount } });
}

async function ensureMilestone(m) {
  const existing = await prisma.milestone.findFirst({ where: { title: m.title } });
  if (existing) return existing;
  return prisma.milestone.create({
    data: { title: m.title, description: m.description || null, actualDate: d(m.actualDate) },
  });
}

async function ensureLink(taskId, milestoneId, daysBefore) {
  const existing = await prisma.taskMilestoneLink.findFirst({ where: { taskId, milestoneId } });
  if (existing) return existing;
  return prisma.taskMilestoneLink.create({ data: { taskId, milestoneId, daysBefore } });
}

async function ensureHouseArea(a, idx) {
  const existing = await prisma.houseArea.findFirst({ where: { name: a.name } });
  if (existing) return existing;
  return prisma.houseArea.create({
    data: { name: a.name, icon: a.icon || null, description: a.description || null, sortOrder: idx },
  });
}

async function main() {
  console.log('[seed] Start.');

  for (let i = 0; i < config.seedUsers.length; i++) {
    await ensureUser(config.seedUsers[i], i);
  }

  await ensureSettings();

  const milestoneByTitle = {};
  for (const m of MILESTONES) {
    milestoneByTitle[m.title] = await ensureMilestone(m);
  }

  for (const p of PHASES) {
    const phase = await prisma.phase.upsert({
      where: { orderNumber: p.orderNumber },
      update: {},
      create: { orderNumber: p.orderNumber, title: p.title, description: p.description },
    });

    for (const l of p.lumpSums || []) {
      await ensureLumpSum(phase.id, l);
    }

    for (const t of p.tasks) {
      const task = await ensureTask(phase.id, t);
      if (t.milestone && milestoneByTitle[t.milestone.title]) {
        await ensureLink(task.id, milestoneByTitle[t.milestone.title].id, t.milestone.daysBefore);
      }
    }
    console.log(`[seed] ${p.title}: ok (${p.tasks.length} Aufgaben).`);
  }

  for (let i = 0; i < HOUSE_AREAS.length; i++) {
    await ensureHouseArea(HOUSE_AREAS[i], i);
  }

  console.log('[seed] Fertig.');
}

main()
  .catch((e) => {
    console.error('[seed] Fehler:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
