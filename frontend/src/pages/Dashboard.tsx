import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import type { Phase, CostSummary, Reminder, ProjectSettings } from '../types';
import { Spinner, Card, ProgressBar, Badge, EmptyState, ErrorBox } from '../components/ui';
import { euro, fmtDate, STATUS_BADGE, STATUS_LABEL } from '../lib/format';

export default function Dashboard() {
  const { data: phases, loading: lp, error: ep } = useFetch<Phase[]>('/phases');
  const { data: costs, loading: lc, error: ec } = useFetch<CostSummary>('/costs/summary');
  const { data: reminders } = useFetch<Reminder[]>('/reminders');
  const { data: settings } = useFetch<ProjectSettings>('/settings');

  if (lp || lc) return <Spinner />;
  if (ep || ec) return <ErrorBox>{ep || ec}</ErrorBox>;
  if (!phases || !costs) return <ErrorBox>Keine Daten verfügbar.</ErrorBox>;

  const allDone = phases.length > 0 && phases.every((p) => p.status === 'done');
  const current = phases.find((p) => p.status === 'in_progress') ?? phases.find((p) => p.status !== 'done') ?? phases[0];
  const totalTasks = phases.reduce((s, p) => s + p.taskCount, 0);
  const doneTasks = phases.reduce((s, p) => s + p.doneCount, 0);
  const overall = totalTasks ? doneTasks / totalTasks : 0;

  const budget = costs.totalBudget ?? costs.totals.plannedTotal;
  const spent = costs.totals.grandTotal;
  const budgetPct = budget ? spent / budget : 0;
  const over = budget > 0 && spent > budget;

  const currentCost = costs.byPhase.find((b) => b.phaseId === current?.id);
  const upcoming = (reminders ?? []).slice(0, 5);
  const overdueCount = (reminders ?? []).filter((r) => r.overdue).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">{settings?.projectName ?? 'allkauf Haus-Helfer'}</h1>
        <p className="text-sm text-slate-500">
          Gesamtfortschritt: {doneTasks}/{totalTasks} Aufgaben
        </p>
        <ProgressBar value={overall} className="mt-2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Aktuelle Phase */}
        <Card title="Aktuelle Phase">
          {allDone ? (
            <div className="py-2 text-center">
              <div className="text-2xl">🎉</div>
              <div className="font-semibold text-emerald-700">Projekt abgeschlossen</div>
              <div className="text-xs text-slate-500">Alle Aufgaben erledigt.</div>
            </div>
          ) : current ? (
            <Link to={`/phases/${current.id}`} className="block">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">{current.title}</span>
                <Badge className={STATUS_BADGE[current.status]}>{STATUS_LABEL[current.status]}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={current.progress} className="flex-1" />
                <span className="text-xs font-medium text-slate-500">
                  {current.doneCount}/{current.taskCount}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {fmtDate(current.startDate)} – {fmtDate(current.endDate)}
              </div>
            </Link>
          ) : (
            <EmptyState>Keine Phase</EmptyState>
          )}
        </Card>

        {/* Budget */}
        <Card title="Budget (geplant vs. ausgegeben)">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-800">{euro(spent)}</div>
              <div className="text-xs text-slate-500">von {budget > 0 ? euro(budget) : '–'} geplant</div>
            </div>
            {over && <Badge className="bg-red-100 text-red-700">über Budget</Badge>}
          </div>
          <ProgressBar value={budgetPct} className={`mt-3 ${over ? '[&>div]:bg-red-500' : ''}`} />
          <Link to="/costs" className="mt-2 inline-block text-xs text-brand hover:underline">
            → Kostenübersicht
          </Link>
        </Card>

        {/* Ausgaben aktuelle Phase */}
        <Card title="Ausgaben aktuelle Phase">
          <div className="text-2xl font-bold text-slate-800">{euro(currentCost?.total ?? 0)}</div>
          <div className="mt-1 text-xs text-slate-500">
            geplant: {euro(currentCost?.planned ?? 0)} · {currentCost?.estimatedHours ?? 0} h Eigenleistung
          </div>
        </Card>

        {/* Wiedervorlagen */}
        <Card title="Nächste Wiedervorlagen" actions={overdueCount > 0 ? <Badge className="bg-red-100 text-red-700">{overdueCount} überfällig</Badge> : undefined}>
          {upcoming.length === 0 ? (
            <EmptyState>Keine offenen Termine.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-slate-700">{r.title}</span>
                  <Badge className={r.overdue ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}>
                    {r.overdue ? '⚠ ' : ''}
                    {fmtDate(r.effectiveDueDate)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/reminders" className="mt-3 inline-block text-xs text-brand hover:underline">
            → Alle Wiedervorlagen
          </Link>
        </Card>
      </div>
    </div>
  );
}
