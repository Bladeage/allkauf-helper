// Seed-Engine (idempotent): legt fehlende Daten an, lässt vorhandene unverändert.
//
// Der INHALT (Phasen, Checklisten, Meilensteine, Räume, Zahlungsplan, Kontakte) steckt
// in austauschbaren Datensätzen unter ./data/:
//   - generic.js  → herstellerneutraler Standard (committet, öffentlich)
//   - custom.js   → persönlicher Datensatz (per .gitignore lokal, nicht im Repo/Image)
//
// Auswahl: Umgebungsvariable SEED_DATASET (z. B. "generic"/"custom") überschreibt.
// Ohne SEED_DATASET wird 'custom' bevorzugt, sonst 'generic' geladen.

import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const d = (s) => (s ? new Date(`${s}T00:00:00.000Z`) : null);

async function loadDataset() {
  // Kandidaten in Reihenfolge; 'generic' immer als letzter Fallback.
  const requested = (process.env.SEED_DATASET || '').trim();
  const candidates = requested ? [requested, 'generic'] : ['custom', 'generic'];
  const tried = [];
  for (const name of [...new Set(candidates)]) {
    try {
      const mod = await import(`./data/${name}.js`);
      console.log(`[seed] Datensatz: ${name}`);
      return mod;
    } catch (e) {
      tried.push(name);
      if (requested && name === requested) {
        console.warn(`[seed] Datensatz '${requested}' nicht ladbar — Fallback auf 'generic'. (${e.code || e.message})`);
      }
    }
  }
  throw new Error(`[seed] Kein Datensatz ladbar (versucht: ${tried.join(', ')}).`);
}

async function ensureSettings(settings) {
  const existing = await prisma.projectSettings.findFirst();
  if (existing) return;
  // Standard: bewusst leer (vom Bauherrn zu füllen). Ein Datensatz kann optionale
  // Beispiel-Einstellungen (SETTINGS) mitliefern (z. B. der Demo-Datensatz).
  const data = settings
    ? {
        ...(settings.projectName != null ? { projectName: settings.projectName } : {}),
        livingAreaSqm: settings.livingAreaSqm ?? null,
        totalBudget: settings.totalBudget ?? null,
        projectStart: d(settings.projectStart),
        projectEnd: d(settings.projectEnd),
        handoverDate: d(settings.handoverDate),
        hourlyRateEigenleistung: settings.hourlyRateEigenleistung ?? null,
        contingencyPercent: settings.contingencyPercent ?? null,
      }
    : {};
  await prisma.projectSettings.create({ data });
  console.log(`[seed] Projekt-Einstellungen (${settings ? 'Demo' : 'leer'}) angelegt.`);
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

async function ensurePaymentPlan(PAYMENT_PLAN) {
  if ((await prisma.paymentInstallment.count()) > 0) return;
  for (let i = 0; i < PAYMENT_PLAN.length; i++) {
    const p = PAYMENT_PLAN[i];
    await prisma.paymentInstallment.create({
      data: { sortOrder: i, label: p.label, dueCondition: p.dueCondition || null, note: p.note || null },
    });
  }
  console.log('[seed] Zahlungsplan (Platzhalter) angelegt.');
}

async function ensureContacts(CONTACTS) {
  if ((await prisma.contact.count()) > 0) return;
  for (let i = 0; i < CONTACTS.length; i++) {
    const c = CONTACTS[i];
    await prisma.contact.create({
      data: { sortOrder: i, name: c.name, role: c.role || null, company: c.company || null },
    });
  }
  console.log('[seed] Kontakte (Platzhalter) angelegt.');
}

async function main() {
  console.log('[seed] Start.');

  const { PHASES, MILESTONES, HOUSE_AREAS, PAYMENT_PLAN, CONTACTS, SETTINGS } = await loadDataset();

  // Nutzer werden NICHT mehr geseedet — der erste Admin wird beim ersten Start
  // über die Onboarding-Seite (POST /api/auth/setup) angelegt.

  await ensureSettings(SETTINGS);

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

  await ensurePaymentPlan(PAYMENT_PLAN);
  await ensureContacts(CONTACTS);

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
