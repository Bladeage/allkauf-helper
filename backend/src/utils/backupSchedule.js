// Reine Zeitplan-Logik für die Datensicherung — bewusst ohne Prisma-/DB-Import,
// damit sie ohne laufende Datenbank getestet werden kann.

export const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export const DEFAULT_TIME = '03:30';

// Ein kaputter Wert darf nie zu einem ungültigen Cron-Ausdruck führen —
// sonst liefe die Sicherung stillschweigend gar nicht mehr.
export function normalizeTime(value, fallback = DEFAULT_TIME) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return fallback;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// Baut den node-cron-Ausdruck aus den benutzerfreundlichen Feldern.
export function toCronExpression({ frequency, time, weekday }) {
  const [h, m] = normalizeTime(time).split(':').map(Number);
  return frequency === 'weekly' ? `${m} ${h} * * ${weekday}` : `${m} ${h} * * *`;
}

export function describeSchedule(s) {
  const when = `${normalizeTime(s.time)} Uhr`;
  return s.frequency === 'weekly' ? `wöchentlich ${WEEKDAYS[s.weekday] || WEEKDAYS[0]}, ${when}` : `täglich ${when}`;
}
