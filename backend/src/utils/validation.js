import { HttpError } from '../middleware/errorHandler.js';

export const COST_CATEGORIES = [
  'allkauf_paket',
  'bemusterung_extra',
  'eigenleistung_material',
  'sonstiges',
];
export const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

// Validiert mit einem zod-Schema und wirft 400 mit lesbarer Meldung.
export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    const msg = r.error.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    throw new HttpError(400, msg);
  }
  return r.data;
}

// 'YYYY-MM-DD' (oder ISO) -> Date | null  (für @db.Date Felder: UTC-Mitternacht)
export function toDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(`${v}T00:00:00.000Z`);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toMoney(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Phasen-Status & Fortschritt aus Tasks ableiten (Abschnitt 7.1)
export function deriveStatus(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.isDone).length;
  let status = 'not_started';
  if (total > 0 && done === total) status = 'done';
  else if (done > 0) status = 'in_progress';
  return { status, done, total, progress: total ? done / total : 0 };
}
