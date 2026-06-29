import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import type { Phase, CostSummary, Reminder, ProjectSettings } from '../types';
import { Spinner, Card, ProgressBar, Badge, Button, EmptyState, ErrorBox } from '../components/ui';
import { euro, fmtDate, STATUS_BADGE, STATUS_LABEL } from '../lib/format';
import SetupWizard from '../components/SetupWizard';

export default function Dashboard() {
  const { data: phases, loading: lp, error: ep, reload: reloadPhases } = useFetch<Phase[]>('/phases');
  const { data: costs, loading: lc, error: ec, reload: reloadCosts } = useFetch<CostSummary>('/costs/summary');
  const { data: reminders, reload: reloadReminders } = useFetch<Reminder[]>('/reminders');
  const { data: settings, reload: reloadSettings } = useFetch<ProjectSettings>('/settings');
  const [wizardOpen, setWizardOpen] = useState(false);
  const reloadAll = () => {
    reloadPhases();
    reloadCosts();
    reloadReminders();
    reloadSettings();
  };

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
  const needsSetup = settings != null && settings.totalBudget == null && settings.projectStart == null;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">{settings?.projectName ?? 'allkauf Haus-Helfer'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gesamtfortschritt: {doneTasks}/{totalTasks} Aufgaben
            </p>
          </div>
          <Button variant="secondary" onClick={() => setWizardOpen(true)}>
            🧭 Einrichtung
          </Button>
        </div>
        <ProgressBar value={overall} className="mt-2" />
      </div>

      {needsSetup && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-700/40 dark:bg-brand-700/15">
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 dark:text-slate-100">Projekt einrichten</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Lege in wenigen Schritten Budget, Termine, Vertrag und Zahlungsplan an — und hol Verpasstes nach.
            </div>
          </div>
          <Button onClick={() => setWizardOpen(true)}>Jetzt einrichten</Button>
        </div>
      )}

      {costs.warnings && costs.warnings.length > 0 && (
        <div className="space-y-2">
          {costs.warnings.map((w, i) => (
            <div
              key={i}
              role="alert"
              className={`rounded-lg px-3 py-2 text-sm ${w.level === 'danger' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}
            >
              {w.level === 'danger' ? '🚨 ' : '⚠ '}
              {w.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Aktuelle Phase */}
        <Card title="Aktuelle Phase">
          {allDone ? (
            <div className="py-2 text-center">
              <div className="text-2xl">🎉</div>
              <div className="font-semibold text-emerald-700">Projekt abgeschlossen</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Alle Aufgaben erledigt.</div>
            </div>
          ) : current ? (
            <Link to={`/phases/${current.id}`} className="block">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{current.title}</span>
                <Badge className={STATUS_BADGE[current.status]}>{STATUS_LABEL[current.status]}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={current.progress} className="flex-1" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {current.doneCount}/{current.taskCount}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{euro(spent)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">von {budget > 0 ? euro(budget) : '–'} geplant</div>
            </div>
            {over && <Badge className="bg-red-100 text-red-700">über Budget</Badge>}
          </div>
          <ProgressBar value={budgetPct} className={`mt-3 ${over ? '[&>div]:bg-red-500' : ''}`} />
          {costs.forecast && costs.forecast.expected > 0 && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Prognose: <b className="text-slate-700 dark:text-slate-200">{euro(costs.forecast.withContingency)}</b>{' '}
              ({euro(costs.forecast.optimistic)}–{euro(costs.forecast.pessimistic)})
            </div>
          )}
          <Link to="/costs" className="mt-2 inline-block text-xs text-brand-700 dark:text-brand-300 hover:underline">
            → Kostenübersicht
          </Link>
        </Card>

        {/* Ausgaben aktuelle Phase */}
        <Card title="Ausgaben aktuelle Phase">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{euro(currentCost?.total ?? 0)}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                  <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">{r.title}</span>
                  <Badge className={r.overdue ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}>
                    {r.overdue ? '⚠ ' : ''}
                    {fmtDate(r.effectiveDueDate)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/reminders" className="mt-3 inline-block text-xs text-brand-700 dark:text-brand-300 hover:underline">
            → Alle Wiedervorlagen
          </Link>
        </Card>
      </div>

      <SetupWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onDone={reloadAll} />
    </div>
  );
}
