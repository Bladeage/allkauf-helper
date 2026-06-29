import { prisma } from '../config/db.js';
import { COST_CATEGORIES } from '../utils/validation.js';

const num = (v) => (v == null ? 0 : Number(v));

// Kosten-Aggregation nach Abschnitt 5:
//  - Phasen-Ausgaben = Summe tasks.cost_amount + Summe phase_lump_sums
//  - Kategorien gruppiert (Lump Sums zählen als allkauf_paket / "allkauf-Grundpreis")
//  - Gesamtsumme + Summe geschätzter Eigenleistungs-Stunden
//  - Ergänzung: Soll/Ist (planned vs. actual), bezahlt, Eigenleistungs-Geldwert
export async function getCostSummary() {
  const [phases, settings] = await Promise.all([
    prisma.phase.findMany({ orderBy: { orderNumber: 'asc' }, include: { tasks: true, lumpSums: true } }),
    prisma.projectSettings.findFirst(),
  ]);

  const hourlyRate = num(settings?.hourlyRateEigenleistung);
  const byPhase = [];
  const totalByCategory = Object.fromEntries(COST_CATEGORIES.map((c) => [c, 0]));
  let actualTotal = 0;
  let plannedTotal = 0;
  let lumpSumTotal = 0;
  let taskCostTotal = 0;
  let estimatedHoursTotal = 0;
  let paidTotal = 0;

  for (const p of phases) {
    const cat = Object.fromEntries(COST_CATEGORIES.map((c) => [c, 0]));
    let pTaskCost = 0;
    let pPlanned = 0;
    let pHours = 0;
    let pPaid = 0;

    for (const t of p.tasks) {
      const amt = num(t.costAmount);
      const planned = t.plannedAmount != null ? num(t.plannedAmount) : amt;
      // Unbekannte/leere Kategorie -> 'sonstiges', damit Σ byCategory == Gesamtsumme bleibt
      const c = COST_CATEGORIES.includes(t.costCategory) ? t.costCategory : 'sonstiges';
      cat[c] += amt;
      pTaskCost += amt;
      pPlanned += planned;
      pHours += num(t.estimatedHours);
      if (t.isPaid) pPaid += amt;
    }

    const pLump = p.lumpSums.reduce((s, l) => s + num(l.amount), 0);
    cat.allkauf_paket += pLump; // Lump Sums = allkauf-Grundpreis-Anteil
    const pTotal = pTaskCost + pLump;

    byPhase.push({
      phaseId: p.id,
      orderNumber: p.orderNumber,
      title: p.title,
      byCategory: cat,
      taskCost: pTaskCost,
      lumpSum: pLump,
      total: pTotal,
      planned: pPlanned + pLump,
      paid: pPaid,
      estimatedHours: pHours,
      phaseBudget: p.budget != null ? num(p.budget) : null,
    });

    for (const c of COST_CATEGORIES) totalByCategory[c] += cat[c];
    actualTotal += pTotal;
    plannedTotal += pPlanned + pLump;
    lumpSumTotal += pLump;
    taskCostTotal += pTaskCost;
    estimatedHoursTotal += pHours;
    paidTotal += pPaid;
  }

  // Budget-Warnungen (Block 4): Gesamt- und Phasen-Budget gegen Ist/Soll prüfen.
  const eur = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
  const warnings = [];
  const tb = settings?.totalBudget != null ? num(settings.totalBudget) : 0;
  if (tb > 0) {
    if (actualTotal > tb) {
      warnings.push({ level: 'danger', scope: 'total', over: actualTotal - tb, message: `Gesamtkosten (Ist) überschreiten das Budget um ${eur(actualTotal - tb)}.` });
    } else if (plannedTotal > tb) {
      warnings.push({ level: 'warn', scope: 'total', over: plannedTotal - tb, message: `Geplante Kosten (Soll) liegen ${eur(plannedTotal - tb)} über dem Budget.` });
    } else if (actualTotal / tb >= 0.9) {
      warnings.push({ level: 'warn', scope: 'total', over: 0, message: `Budget zu ${Math.round((actualTotal / tb) * 100)} % ausgeschöpft.` });
    }
  }
  for (const ph of byPhase) {
    if (ph.phaseBudget != null && ph.phaseBudget > 0 && ph.total > ph.phaseBudget) {
      warnings.push({ level: 'warn', scope: 'phase', phaseId: ph.phaseId, over: ph.total - ph.phaseBudget, message: `${ph.title}: Ausgaben ${eur(ph.total - ph.phaseBudget)} über Phasen-Budget.` });
    }
  }

  return {
    byPhase,
    warnings,
    totals: {
      byCategory: totalByCategory,
      taskCostTotal,
      lumpSumTotal,
      grandTotal: actualTotal,
      plannedTotal,
      paidTotal,
      estimatedHoursTotal,
      eigenleistungValue: hourlyRate ? estimatedHoursTotal * hourlyRate : null,
    },
    hourlyRate: hourlyRate || null,
    totalBudget: settings?.totalBudget != null ? num(settings.totalBudget) : null,
    livingAreaSqm: settings?.livingAreaSqm != null ? num(settings.livingAreaSqm) : null,
  };
}
