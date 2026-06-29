import { prisma } from '../config/db.js';
import { computeEffectiveDueDate } from '../utils/dueDate.js';

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function loadTasksWithDates() {
  const tasks = await prisma.task.findMany({
    include: { phase: true, milestoneLinks: { include: { milestone: true } } },
  });
  return tasks
    .map((t) => ({ ...t, effectiveDueDate: computeEffectiveDueDate(t) }))
    .filter((t) => t.effectiveDueDate);
}

// Zentrale Wiedervorlagen-Ansicht (Abschnitt 7.4): offene Aufgaben mit Datum, sortiert.
export async function getReminders() {
  const today = startOfTodayUTC();
  const weekEnd = new Date(today);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const tasks = (await loadTasksWithDates()).filter((t) => !t.isDone);
  tasks.sort((a, b) => a.effectiveDueDate - b.effectiveDueDate);

  return tasks.map((t) => {
    const due = t.effectiveDueDate;
    const link = (t.milestoneLinks || [])[0];
    return {
      id: t.id,
      title: t.title,
      phaseId: t.phaseId,
      phaseTitle: t.phase?.title || null,
      priority: t.priority,
      effectiveDueDate: due.toISOString(),
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      hasMilestone: Boolean(link),
      milestoneTitle: link?.milestone?.title || null,
      daysBefore: link?.daysBefore ?? null,
      overdue: due < today,
      dueThisWeek: due >= today && due < weekEnd,
    };
  });
}

// Für den E-Mail-Job: Aufgaben, deren effektives Datum <= heute+lookahead (inkl. überfällig).
export async function collectDueTasks(lookaheadDays) {
  const today = startOfTodayUTC();
  const limit = new Date(today);
  limit.setUTCDate(limit.getUTCDate() + lookaheadDays);

  const tasks = (await loadTasksWithDates()).filter(
    (t) => !t.isDone && t.effectiveDueDate <= limit,
  );
  tasks.sort((a, b) => a.effectiveDueDate - b.effectiveDueDate);
  return tasks.map((t) => ({ ...t, overdue: t.effectiveDueDate < today }));
}
