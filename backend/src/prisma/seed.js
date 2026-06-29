// Seed: Phasen & Checklisten (Abschnitt 11) + zwei Nutzer-Accounts (Abschnitt 8)
// + recherche-basierte Ergänzungen (is_custom = true, klar als optional markiert)
// + Kosten-Platzhalter (Bemusterung/Baunebenkosten/allkauf-Pauschalen).
//
// Idempotent: legt fehlende Daten an, lässt vorhandene unverändert (keine Daten-
// verluste bei erneutem Lauf, daher auch beim Container-Start ausführbar).

import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { config } from '../config/env.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// 'YYYY-MM-DD' -> Date (UTC-Mitternacht), passend für @db.Date
const d = (s) => (s ? new Date(`${s}T00:00:00.000Z`) : null);

const CAT = {
  paket: 'allkauf_paket',
  bem: 'bemusterung_extra',
  eigen: 'eigenleistung_material',
  sonst: 'sonstiges',
};

// O = offizielle §11-Aufgabe (Baseline, nicht löschbar)
// S = recherche-basierte Ergänzung (is_custom = true, optional/löschbar)
const O = (title, extra = {}) => ({ title, isCustom: false, ...extra });
const S = (title, extra = {}) => ({ title, isCustom: true, ...extra });

const PHASES = [
  {
    orderNumber: 0,
    title: 'Phase 0 — Vorbereitung & Entscheidung',
    description: 'Grundstück, Finanzierung, Hausmodell, Vertrag.',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    lumpSums: [],
    tasks: [
      O('Grundstück gekauft / gesichert'),
      O('Bodengutachten erstellt'),
      O('Geprüft: Schutzgebiet (z. B. Wasserschutz), Auflagen vom Bauamt, Altlasten/Kampfmittel'),
      O('Finanzierung grundsätzlich geklärt (Vorab-Zusage)'),
      O('Hausmodell ausgewählt (Home 12)'),
      O('Ausbaustufe gewählt (Ausbauhaus + gewähltes Paket)'),
      O('Musterhaus besichtigt'),
      O('Werkvertrag (Verbraucherbauvertrag) geprüft & unterschrieben'),
      S('KfW/BEG-Förderung VOR Vertragsabschluss prüfen & beantragen', {
        description:
          'Programme 297/298 „Klimafreundlicher Neubau" verfallen unwiderruflich bei nachträglicher Beantragung — auch Lieferverträge zählen als Vorhabenbeginn.',
        priority: 'high',
      }),
      S('Energieeffizienz-Experte (EEE) aus dena-Liste beauftragt', {
        description: 'Pflichtvoraussetzung für KfW-Förderung; stellt später die „Bestätigung nach Durchführung" (BnD) aus.',
      }),
      S('Bauherrenhaftpflicht-, Bauleistungs- & Feuerrohbauversicherung abgeschlossen', {
        description: 'Drei Bauzeit-Absicherungen; Feuerrohbau wird später zur Wohngebäudeversicherung. Oft Finanzierungsbedingung.',
      }),
      S('Risikolebens-/BU-Versicherung für Kreditnehmer geprüft'),
      S('Bebauungsplan geprüft (Dachform/-neigung, GRZ/GFZ, Abstandsflächen, Gestaltungssatzung)'),
      S('Grundbuch geprüft (Dienstbarkeiten, Wege-/Leitungsrechte); Finanzierungsgrundschuld vorgemerkt'),
      S('Erwerbsnebenkosten: Grunderwerbsteuer', { costCategory: CAT.sonst }),
      S('Erwerbsnebenkosten: Notar & Grundbucheintrag', { costCategory: CAT.sonst }),
      S('Maklerprovision (falls angefallen)', { costCategory: CAT.sonst }),
    ],
  },
  {
    orderNumber: 1,
    title: 'Phase 1 — Planung & Bemusterung',
    description: 'Grundriss, Kreditvertrag, Bemusterung, Eigenleistungs-Posten.',
    startDate: '2025-05-01',
    endDate: '2025-09-30',
    lumpSums: [{ label: 'allkauf-Grundpreis Planungs-/Paketanteil (Platzhalter — bitte eintragen)', amount: 0 }],
    tasks: [
      O('Grundriss finalisiert, Sonderwünsche besprochen'),
      O('Finanzierung final gesichert (Kreditvertrag)'),
      O('Bemusterung wahrgenommen: Dach & Fassade, Fenster & Außentüren, Innentüren, Treppe, Bodenbeläge & Fliesen, Sanitärobjekte & Armaturen, Elektro (Steckdosen/Schalter/Smart Home), Heizung'),
      O('Bemusterungsprotokoll erhalten & geprüft'),
      O('Eigenleistungs-Posten definiert (was selbst, was allkauf)'),
      S('Verbindlicher Bauzeitenplan angefordert + Pönale bei Terminverzug im Vertrag'),
      S('Elektro-/Haustechnikplanung fixiert (Steckdosen-/Schalterplan, LAN/Glasfaser-Leerrohre, Leerrohre für spätere PV/Speicher)', {
        description: 'Nach Trockenbau nicht mehr korrigierbar; bei Ausbauhaus meist Eigenleistung.',
        priority: 'high',
      }),
      S('Eigenleistungs-Schnittstellen schriftlich mit Hersteller & Nachunternehmern abgestimmt', {
        description: 'Klare Übergabepunkte definieren, sonst Gewährleistungslücken an der Grenze Hersteller/Eigenleistung.',
      }),
      S('Lüftungskonzept nach DIN 1946-6 geklärt (KWL erforderlich?)'),
      // Bemusterungs-Zusätze als Kosten-Platzhalter (Beträge liefert Fabian später)
      S('Bemusterung: Premium-Fliesen statt Standard (Platzhalter)', { costCategory: CAT.bem, plannedAmount: 500 }),
      S('Bemusterung: Küche-Upgrade (Platzhalter)', { costCategory: CAT.bem, plannedAmount: 3000 }),
      S('Bemusterung: Garage / Carport (Platzhalter)', { costCategory: CAT.bem }),
      S('Bemusterung: Sanitär-Upgrade (Platzhalter)', { costCategory: CAT.bem }),
      S('Bemusterung: Elektro / Smart-Home-Mehrausstattung (Platzhalter)', { costCategory: CAT.bem }),
    ],
  },
  {
    orderNumber: 2,
    title: 'Phase 2 — Genehmigung & Grundstücksvorbereitung',
    description: 'Bauantrag, Genehmigung, Einmessung, Erschließung, Aushub.',
    startDate: '2025-09-01',
    endDate: '2026-02-28',
    lumpSums: [],
    tasks: [
      O('Bauantrag eingereicht (i. d. R. über Architekt)'),
      O('Baugenehmigung erhalten / Baufreigabe'),
      O('Grundstück eingemessen'),
      O('Erschließung & Hausanschlüsse (Wasser, Abwasser, Strom, Telekom)'),
      O('Baustrom & Bauwasser organisiert'),
      O('Erdarbeiten / Aushub'),
      S('OKFF / Höhenlage mit Vermesser & Hersteller koordiniert', {
        description: 'Bestimmt Eingangshöhe, Entwässerungsgefälle, Geländemodellierung; nach Rohbau kaum korrigierbar.',
      }),
      S('Baubeginnanzeige bei der Baubehörde eingereicht', { description: 'In den meisten Bundesländern Pflicht (oft 2 Wochen vor Baubeginn).' }),
      S('Bauvorhaben bei der BG BAU angemeldet', { description: 'Pflicht binnen 1 Woche nach Baubeginn; Unfallversicherung für alle Bauhelfer.', priority: 'high' }),
      S('Baustelle gesichert (Bauzaun, Bauschild)', { description: 'Verkehrssicherungspflicht des Bauherrn.' }),
      S('Hausanschluss Strom (Platzhalter)', { costCategory: CAT.sonst }),
      S('Hausanschluss Wasser/Abwasser (Platzhalter)', { costCategory: CAT.sonst }),
      S('Hausanschluss Telekom/Glasfaser (Platzhalter)', { costCategory: CAT.sonst }),
      S('Versicherungen Bauzeit (Bauherrenhaftpflicht/Bauleistung) (Platzhalter)', { costCategory: CAT.sonst }),
    ],
  },
  {
    orderNumber: 3,
    title: 'Phase 3 — Rohbau',
    description: 'Bodenplatte, Hausaufstellung, Dach, Richtfest, wind-/wetterdicht.',
    startDate: '2026-03-01',
    endDate: '2026-05-15',
    lumpSums: [{ label: 'allkauf-Grundpreis Rohbau-Anteil (Beispiel/Platzhalter)', amount: 50000 }],
    tasks: [
      O('Bodenplatte (oder Keller) erstellt'),
      O('Aushärtung Bodenplatte'),
      O('Hauslieferung terminiert'),
      O('Hausaufstellung (Fertigteilelemente)'),
      O('Dachkonstruktion'),
      O('Richtfest 🎉'),
      O('Gebäude wind- und wetterdicht'),
      S('Bautagebuch geführt (Datum, Wetter, Gewerke, Lieferungen)', { description: 'Wichtiges Beweismittel bei späteren Mängelstreitigkeiten.' }),
      S('Fertigelemente auf Feuchte/Nässe geprüft & protokolliert'),
      S('Baubegleitung durch Sachverständigen an Schlüsselterminen', { description: 'Bewehrung vor Betonage, Hausaufstellung, Dach — nach Verschluss nicht mehr sichtbar.' }),
      S('Gerüst (Platzhalter)', { costCategory: CAT.sonst }),
      S('Kran / Montage (Platzhalter)', { costCategory: CAT.sonst }),
      S('Erdaushub-Entsorgung / Altlasten (Platzhalter)', { costCategory: CAT.sonst }),
    ],
  },
  {
    orderNumber: 4,
    title: 'Phase 4 — Innenausbau (Eigenleistung — größter Block)',
    description: 'Elektro, Sanitär, Heizung, Estrich, Fliesen, Böden, Maler, Küche.',
    startDate: '2026-05-01',
    endDate: '2026-12-20',
    lumpSums: [{ label: 'allkauf-Paket Innenausbau-Anteil (Platzhalter)', amount: 0 }],
    tasks: [
      O('Elektroinstallation (Leitungen, Dosen, Verteiler)', { estimatedHours: 80 }),
      O('Sanitärinstallation (Leitungen, Vorwände WC/Waschtisch)', { estimatedHours: 60 }),
      O('Heizungsinstallation (Fußbodenheizung verlegen)', { estimatedHours: 50 }),
      O('Dämmung (Bodenplatte/EG-Decke, Dachschrägen, DG-Decke)', { estimatedHours: 40 }),
      O('Trockenbau / Beplankung (Decken, Dachschrägen, Vorwände)', { estimatedHours: 80 }),
      O('Estrich', { estimatedHours: 40, description: 'Typischer relativer Meilenstein — siehe Wiedervorlagen.' }),
      O('Innenputz / Wandvorbereitung', { estimatedHours: 40 }),
      O('Fliesen (Bad, ggf. Küche)', { estimatedHours: 60, costCategory: CAT.eigen }),
      O('Bodenbeläge (Laminat/Parkett/Fliesen)', { estimatedHours: 40, costCategory: CAT.eigen }),
      O('Innentüren einbauen', { estimatedHours: 16 }),
      O('Treppe einbauen', { estimatedHours: 16 }),
      O('Maler- & Tapezierarbeiten', { estimatedHours: 50 }),
      O('Sanitärobjekte Endmontage', { estimatedHours: 20 }),
      O('Elektro-Endmontage (Schalter, Steckdosen, Leuchten)', { estimatedHours: 24 }),
      O('Küche einbauen', { estimatedHours: 20 }),
      S('Bei allkauf den Estrich-/Heizestrich-Termin rechtzeitig (8 Wochen vorher) anstoßen', {
        description: 'Demo für relative Meilensteine: 56 Tage vor „Estrich fertig".',
        priority: 'high',
        milestone: { title: 'Estrich fertig', daysBefore: 56 },
      }),
      S('Estrich-Trocknung einhalten + CM-Messung (Belegreife) vor Bodenbelag', {
        description: 'Zementestrich mind. 28 Tage; Heizestrich-Aufheizprotokoll vorher. Zu früh = Aufwölbungen + Gewährleistungsverlust.',
        priority: 'high',
      }),
      S('Blower-Door-Test (Luftdichtheit) beauftragt', { description: 'Pflicht bei KfW 297/298; vor Verschluss der Hohlräume.' }),
      S('Eigenleistungshelfer bei der BG BAU angemeldet', { description: 'Pflicht für alle privaten Bauhelfer; Bußgeld bis 2.500 € bei Versäumnis.' }),
      S('Gewerke-Reihenfolge im Innenausbau verbindlich geplant', { description: 'FBH → Estrich → Trocknung → Innenputz → Fliesen → Aufheizen/CM → Bodenbelag → Maler → Türen.' }),
      S('Material: Laminat/Parkett (Platzhalter)', { costCategory: CAT.eigen, plannedAmount: 1200 }),
      S('Material: Wandfarbe (Platzhalter)', { costCategory: CAT.eigen, plannedAmount: 300 }),
      S('Material: Fliesen (Platzhalter)', { costCategory: CAT.eigen }),
      S('Küche (Möbel + Geräte) (Platzhalter)', { costCategory: CAT.eigen }),
      S('Bauendreinigung / Werkzeugmiete / Bauschuttentsorgung (Platzhalter)', { costCategory: CAT.sonst }),
    ],
  },
  {
    orderNumber: 5,
    title: 'Phase 5 — Abnahme & Einzug',
    description: 'Abnahme, Mängel, Schlussrechnung, Umzug, Außenanlagen.',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    lumpSums: [],
    tasks: [
      O('Bauabnahme (Mängelprotokoll)'),
      O('Mängel beheben & nachkontrollieren'),
      O('Schlussrechnung prüfen & begleichen'),
      O('Versicherungen umstellen (Wohngebäude statt Bauleistung)'),
      O('Zähler anmelden / Anschlüsse final'),
      O('Umzug'),
      O('Außenanlagen (Terrasse, Wege, Entwässerung, Garten)'),
      S('Unabhängigen Sachverständigen zur Bauabnahme hinzugezogen', { description: 'Nach Abnahme kehrt die Beweislast um. Kosten ca. 500–1.000 €.', priority: 'high' }),
      S('5 % Sicherheitseinbehalt von der Schlussrechnung einbehalten', { description: 'Bis zur Klärung aller Gewährleistungsansprüche (alternativ Bürgschaft).' }),
      S('Energieausweis (Bedarfsausweis nach GEG) vom Hersteller eingefordert'),
      S('KfW/BEG: Bestätigung nach Durchführung (BnD) fristgerecht eingereicht', { description: 'Ohne BnD wird der Förderkredit zurückgefordert.', priority: 'high' }),
      S('Hausnummer beantragt'),
      S('Ummeldung beim Einwohnermeldeamt (innerhalb 2 Wochen nach Einzug)'),
      S('Außenanlagen: Terrasse (Platzhalter)', { costCategory: CAT.eigen }),
      S('Außenanlagen: Einfahrt/Zufahrt (Platzhalter)', { costCategory: CAT.eigen }),
      S('Außenanlagen: Garten/Rasen/Zaun (Platzhalter)', { costCategory: CAT.eigen }),
      S('Puffer / Unvorhergesehenes (Platzhalter, ~10–15 % der Bausumme)', { costCategory: CAT.sonst }),
    ],
  },
  {
    orderNumber: 6,
    title: 'Phase 6 — Gewährleistung & nach dem Einzug',
    description: 'Vorschlag (Ergänzung): die ersten 0–5 Jahre nach Abnahme.',
    startDate: '2027-02-01',
    endDate: '2032-02-01',
    lumpSums: [],
    tasks: [
      S('Bauunterlagen dauerhaft archiviert (Pläne, Statik, Protokolle, Bürgschaft, Wartungshefte)'),
      S('Mängel unverzüglich schriftlich rügen & Nachbesserungsfrist setzen', { priority: 'high' }),
      S('Hydraulischen Abgleich der Heizungsanlage durchführen lassen', { description: 'GEG-Pflicht; idealerweise nach erster Heizperiode.' }),
      S('Gewährleistungsbegehung mit Sachverständigem ~6 Monate vor Ablauf der 5-Jahres-Frist', { priority: 'high' }),
      S('Wohngebäudeversicherung auf Elementarschadendeckung geprüft'),
      S('Jährliche Wartung/Inspektion (Heizung, Lüftung/KWL, Schornsteinfeger)'),
    ],
  },
];

const MILESTONES = [
  { title: 'Hausaufstellung / Richtfest', description: 'Montage der Fertigteilelemente.', actualDate: '2026-04-15' },
  { title: 'Estrich fertig', description: 'Estrich eingebracht — Start der Trocknungszeit.', actualDate: '2026-08-15' },
  { title: 'Bauabnahme', description: 'Förmliche Abnahme mit Mängelprotokoll.', actualDate: null },
  { title: 'Übergabe / Einzug', description: 'Schlüsselübergabe und Einzug.', actualDate: null },
];

const HOUSE_AREAS = [
  { name: 'Familienbad', icon: '🛁', description: 'Wanne, Dusche, Doppelwaschtisch, Fliesen.' },
  { name: 'Gäste-WC', icon: '🚻', description: 'Kompakt, pflegeleicht.' },
  { name: 'Küche', icon: '🍳', description: 'Grundriss, Anschlüsse, Geräte, Bemusterung.' },
  { name: 'Wohn-/Esszimmer', icon: '🛋️', description: 'Bodenbelag, Licht, Steckdosen, Heizung.' },
  { name: 'Schlafzimmer', icon: '🛏️', description: 'Ankleide, Steckdosen, Licht.' },
  { name: 'Kinderzimmer', icon: '🧸', description: 'Flexible Nutzung, Netzwerk/Leerrohre.' },
  { name: 'Hauswirtschaftsraum (HWR)', icon: '🧺', description: 'Waschen, Trockner, Stauraum, Technik.' },
  { name: 'Technikraum', icon: '⚙️', description: 'Heizung, Verteiler, KWL, Wasser.' },
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
  await prisma.projectSettings.create({
    data: {
      projectName: 'allkauf Home 12 — Bau-Begleiter',
      livingAreaSqm: 172,
      totalBudget: null, // Platzhalter — Gesamtbudget bitte eintragen
      projectStart: d('2025-01-01'),
      projectEnd: d('2027-02-28'),
      handoverDate: null,
      hourlyRateEigenleistung: 40, // Platzhalter für Eigenleistungs-Geldwert-Hochrechnung
    },
  });
  console.log('[seed] Projekt-Einstellungen angelegt.');
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

  // 1) Nutzer
  for (let i = 0; i < config.seedUsers.length; i++) {
    await ensureUser(config.seedUsers[i], i);
  }

  // 2) Projekt-Einstellungen
  await ensureSettings();

  // 3) Meilensteine (vor den Tasks, damit Verknüpfungen aufgelöst werden können)
  const milestoneByTitle = {};
  for (const m of MILESTONES) {
    const created = await ensureMilestone(m);
    milestoneByTitle[m.title] = created;
  }

  // 4) Phasen + LumpSums + Tasks (+ Meilenstein-Verknüpfungen)
  for (const p of PHASES) {
    const phase = await prisma.phase.upsert({
      where: { orderNumber: p.orderNumber },
      update: {}, // vorhandene Phase unverändert lassen
      create: {
        orderNumber: p.orderNumber,
        title: p.title,
        description: p.description,
        startDate: d(p.startDate),
        endDate: d(p.endDate),
      },
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

  // 5) Haus-Bereiche (experimentelles Modul)
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
