import type { CostCategory, Priority } from '../types';

export const euro = (n: number | null | undefined): string =>
  n == null
    ? '–'
    : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export const euroPrecise = (n: number | null | undefined): string =>
  n == null ? '–' : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

// Date-only Felder werden als UTC-Mitternacht geliefert -> in UTC formatieren (kein Off-by-one)
export const fmtDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : '–';

export const fmtDateShort = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : '–';

// Für <input type="date"> — robust gegen ungültige Werte (sonst RangeError im Render)
export const toInputDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export const fmtHours = (n: number | null | undefined): string => (n == null ? '–' : `${n} h`);

export const CATEGORY_LABEL: Record<CostCategory, string> = {
  allkauf_paket: 'allkauf-Grundpreis',
  bemusterung_extra: 'Bemusterung',
  eigenleistung_material: 'Eigenleistung Material',
  sonstiges: 'Sonstiges',
};

export const CATEGORY_BADGE: Record<CostCategory, string> = {
  allkauf_paket: 'bg-slate-200 text-slate-700',
  bemusterung_extra: 'bg-amber-100 text-amber-800',
  eigenleistung_material: 'bg-emerald-100 text-emerald-800',
  sonstiges: 'bg-sky-100 text-sky-800',
};

export const CATEGORY_BAR: Record<CostCategory, string> = {
  allkauf_paket: 'bg-slate-500',
  bemusterung_extra: 'bg-amber-500',
  eigenleistung_material: 'bg-emerald-500',
  sonstiges: 'bg-sky-500',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
  urgent: 'Dringend',
};

export const PRIORITY_BADGE: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-500',
  normal: 'bg-slate-100 text-slate-600',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export const STATUS_LABEL: Record<string, string> = {
  not_started: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Fertig',
};

export const STATUS_BADGE: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
};
