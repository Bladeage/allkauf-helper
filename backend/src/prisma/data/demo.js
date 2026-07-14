// Demo-Datensatz: der herstellerneutrale generic-Datensatz + Beispielwerte (Beträge,
// Projekt-Einstellungen), damit eine Test-/Vorschau-Instanz „lebendig" wirkt statt leer.
// Aktivieren mit  SEED_DATASET=demo  (z. B. für Screenshots oder eine öffentliche Demo).
import * as g from './generic.js';

export const { MILESTONES, HOUSE_AREAS, PAYMENT_PLAN, CONTACTS } = g;

// Beispiel-Projekteinstellungen (füllt Dashboard-Budget, Gantt-Marker, Stunden→Geldwert).
export const SETTINGS = {
  projectName: 'Musterhaus Beispielweg 12',
  livingAreaSqm: 142,
  totalBudget: 420000,
  projectStart: '2026-03-01',
  handoverDate: '2026-12-15',
  hourlyRateEigenleistung: 25,
  contingencyPercent: 10,
};

// Beispiel-Sollbeträge je Kostenkategorie (nur zur Veranschaulichung).
const PLANNED = {
  allkauf_paket: 285000,
  bemusterung_extra: 4200,
  eigenleistung_material: 3500,
  sonstiges: 2500,
};

// generic-Inhalte übernehmen und mit Beispielbeträgen anreichern.
export const PHASES = g.PHASES.map((p, pi) => ({
  ...p,
  lumpSums: (p.lumpSums || []).map((l) => ({ ...l, amount: l.amount || 285000 })),
  tasks: p.tasks.map((t, ti) => {
    if (!t.costCategory) return t;
    const planned = PLANNED[t.costCategory] ?? 1500;
    // grob jede zweite Position schon „ausgegeben" → Soll/Ist-Kontrast in der Kostenansicht
    const spent = (pi + ti) % 2 === 0 ? Math.round(planned * 0.9) : null;
    return { ...t, plannedAmount: planned, costAmount: spent };
  }),
}));
