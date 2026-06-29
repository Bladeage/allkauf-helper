import { useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import type { Phase, Milestone, ProjectSettings } from '../types';
import { Spinner, PageHeader, EmptyState, ErrorBox } from '../components/ui';

const DAY = 86400000;
const PX_PER_DAY = 6;
const ROW_H = 44;
const BAR_H = 26;
const HEADER_H = 60;
const PAD_DAYS = 10;

const STATUS_FILL: Record<string, string> = {
  not_started: '#cbd5e1',
  in_progress: '#f59e0b',
  done: '#10b981',
};

function shortTitle(t: string): string {
  const s = t.replace(/^Phase \d+ — /, '');
  return s.length > 30 ? `${s.slice(0, 29)}…` : s;
}

export default function Timeline() {
  const navigate = useNavigate();
  const { data: phases, loading, error } = useFetch<Phase[]>('/phases');
  const { data: milestones } = useFetch<Milestone[]>('/milestones');
  const { data: settings } = useFetch<ProjectSettings>('/settings');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!phases) return null;

  const bars = phases
    .filter((p) => p.startDate && p.endDate)
    .map((p) => ({ p, start: new Date(p.startDate as string), end: new Date(p.endDate as string) }));
  const mstones = (milestones ?? [])
    .filter((m) => m.actualDate)
    .map((m) => ({ m, date: new Date(m.actualDate as string) }));
  const partialCount = phases.filter((p) => (p.startDate ? 1 : 0) + (p.endDate ? 1 : 0) === 1).length;

  if (bars.length === 0) {
    return (
      <div>
        <PageHeader title="Zeitleiste" />
        <EmptyState>Noch keine Phasen-Termine hinterlegt. Trage Start/Ende je Phase ein (Phase → bearbeiten).</EmptyState>
      </div>
    );
  }

  const times = [
    ...bars.flatMap((b) => [+b.start, +b.end]),
    ...mstones.map((x) => +x.date),
    ...(settings?.projectStart ? [+new Date(settings.projectStart)] : []),
    ...(settings?.projectEnd ? [+new Date(settings.projectEnd)] : []),
  ];
  const min = Math.min(...times) - PAD_DAYS * DAY;
  const max = Math.max(...times) + PAD_DAYS * DAY;
  const totalDays = Math.ceil((max - min) / DAY);
  const width = Math.max(320, totalDays * PX_PER_DAY);
  const height = HEADER_H + bars.length * ROW_H + 16;
  const x = (t: number) => ((t - min) / DAY) * PX_PER_DAY;

  const ticks: { x: number; label: string }[] = [];
  const d = new Date(min);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  while (+d <= max) {
    ticks.push({ x: x(+d), label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit', timeZone: 'UTC' }) });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }

  const today = Date.now();
  const showToday = today >= min && today <= max;
  const openPhase = (id: number) => navigate(`/phases/${id}`);

  return (
    <div>
      <PageHeader title="Zeitleiste" subtitle="Bauphasen als Balken — dürfen sich überlappen, horizontal scrollbar" />
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ background: STATUS_FILL.done }} />
          Fertig
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ background: STATUS_FILL.in_progress }} />
          In Arbeit
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ background: STATUS_FILL.not_started }} />
          Offen
        </span>
        <span className="flex items-center gap-1 text-indigo-500">◆ Meilenstein</span>
        {showToday && <span className="flex items-center gap-1 text-red-500">▏heute</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
        <svg width={width} height={height} className="block" role="img" aria-label="Bauphasen-Zeitleiste (Gantt)">
          {/* Monats-Gridlines (hinten) */}
          {ticks.map((t, i) => (
            <g key={`t${i}`}>
              <line x1={t.x} y1={HEADER_H - 10} x2={t.x} y2={height} stroke="#f1f5f9" />
              <text x={t.x + 4} y={HEADER_H - 16} fontSize="11" fill="#94a3b8">
                {t.label}
              </text>
            </g>
          ))}

          {/* Phasen-Balken */}
          {bars.map((b, i) => {
            const s = Math.min(+b.start, +b.end);
            const e = Math.max(+b.start, +b.end);
            const y = HEADER_H + i * ROW_H + (ROW_H - BAR_H) / 2;
            const bx = x(s);
            const bw = Math.max(10, x(e) - x(s));
            return (
              <g
                key={b.p.id}
                role="button"
                tabIndex={0}
                aria-label={`Phase öffnen: ${b.p.title}`}
                className="cursor-pointer"
                onClick={() => openPhase(b.p.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    openPhase(b.p.id);
                  }
                }}
              >
                <title>{b.p.title}</title>
                <clipPath id={`clip-${b.p.id}`}>
                  <rect x={bx} y={y} width={bw} height={BAR_H} rx={8} />
                </clipPath>
                <rect x={bx} y={y} width={bw} height={BAR_H} rx={8} fill={STATUS_FILL[b.p.status]} opacity={0.92} />
                {bw >= 44 && (
                  <text
                    clipPath={`url(#clip-${b.p.id})`}
                    x={bx + 8}
                    y={y + BAR_H / 2 + 4}
                    fontSize="12"
                    fill="#0f172a"
                    className="pointer-events-none select-none"
                  >
                    {shortTitle(b.p.title)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Heute-Linie (über den Balken) */}
          {showToday && (
            <line x1={x(today)} y1={HEADER_H - 10} x2={x(today)} y2={height} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
          )}

          {/* Meilensteine (über den Balken), Labels gestaffelt */}
          {mstones.map((mm, i) => {
            const mx = x(+mm.date);
            const labelY = HEADER_H + 2 + (i % 2) * 12;
            const label = mm.m.title.length > 20 ? `${mm.m.title.slice(0, 19)}…` : mm.m.title;
            return (
              <g key={`m${i}`}>
                <line x1={mx} y1={HEADER_H - 10} x2={mx} y2={height} stroke="#6366f1" strokeDasharray="2 3" opacity={0.6} />
                <path d={`M ${mx} ${HEADER_H - 8} l 6 6 l -6 6 l -6 -6 z`} fill="#6366f1" />
                <text x={mx + 8} y={labelY} fontSize="10" fill="#6366f1">
                  {label}
                  <title>{mm.m.title}</title>
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Tipp: Auf einen Balken tippen (oder mit Tab + Enter) öffnet die Phase. Termine je Phase (bearbeiten) bzw.
        Projektstart/-ende unter „Einstellungen" pflegen.
        {partialCount > 0 && ` ${partialCount} Phase(n) mit nur einem Datum werden hier noch nicht angezeigt.`}
      </p>
    </div>
  );
}
