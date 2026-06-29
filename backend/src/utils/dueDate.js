// Effektives Fälligkeitsdatum einer Aufgabe (Abschnitt 4 / 7.4):
//   = milestone.actual_date - days_before  (falls über task_milestone_links verknüpft & Datum gesetzt)
//   sonst due_date
// Bei mehreren Verknüpfungen gewinnt das früheste Datum (konservativste Erinnerung).
export function computeEffectiveDueDate(task) {
  const candidates = [];
  if (task.dueDate) candidates.push(new Date(task.dueDate));

  for (const link of task.milestoneLinks || []) {
    const actual = link.milestone && link.milestone.actualDate;
    if (actual) {
      const d = new Date(actual);
      d.setUTCDate(d.getUTCDate() - (link.daysBefore || 0));
      candidates.push(d);
    }
  }

  if (candidates.length === 0) return null;
  return new Date(Math.min(...candidates.map((d) => d.getTime())));
}

// Hängt das berechnete Feld an ein Task-Objekt an (für API-Antworten).
export function withEffectiveDueDate(task) {
  return { ...task, effectiveDueDate: computeEffectiveDueDate(task) };
}
