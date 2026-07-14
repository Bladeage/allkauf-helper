import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { CostSummary, CostCategory, CostSnapshot } from '../types';
import { Spinner, Card, Badge, Button, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { euro, fmtHours, fmtDate, CATEGORY_LABEL, CATEGORY_BADGE, CATEGORY_BAR } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const CATS: CostCategory[] = ['allkauf_paket', 'bemusterung_extra', 'eigenleistung_material', 'sonstiges'];

export default function Costs() {
  const { data, loading, error } = useFetch<CostSummary>('/costs/summary');
  const { data: snaps, reload: reloadSnaps } = useFetch<CostSnapshot[]>('/cost-snapshots');
  const [savingSnap, setSavingSnap] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function saveSnapshot() {
    setSavingSnap(true);
    try {
      await api.post('/cost-snapshots', {});
      toast.success('Kostenstand gesichert');
      reloadSnaps();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSavingSnap(false);
    }
  }
  async function delSnapshot(id: number) {
    if (!(await confirm({ message: 'Diesen Kostenstand löschen?', danger: true, confirmLabel: 'Löschen' }))) return;
    try {
      await api.delete(`/cost-snapshots/${id}`);
      reloadSnaps();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!data) return null;

  const { totals } = data;
  const f = data.forecast;
  const budget = data.totalBudget ?? totals.plannedTotal;
  const over = budget > 0 && totals.grandTotal > budget;
  const grand = totals.grandTotal || 1;
  const snapList = snaps ?? [];
  const maxSnap = Math.max(1, ...snapList.map((s) => s.withContingency || s.expected));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kosten"
        subtitle="Grundpreis · Bemusterung · Eigenleistung · Sonstiges"
        actions={
          <div className="flex gap-2">
            <a href="/api/exports/costs.csv" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
              ⬇ CSV
            </a>
            <a href="/api/exports/costs.pdf" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
              ⬇ PDF
            </a>
          </div>
        }
      />

      {data.warnings && data.warnings.length > 0 && (
        <div className="space-y-2">
          {data.warnings.map((w, i) => (
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

      {/* Summen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Ist-Kosten (inkl. Pauschalen)</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{euro(totals.grandTotal)}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">davon bezahlt: {euro(totals.paidTotal)}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Geplant (Soll)</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{euro(totals.plannedTotal)}</div>
          {data.totalBudget != null && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Gesamtbudget: {euro(data.totalBudget)}</div>}
        </Card>
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Eigenleistung (Stunden)</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{fmtHours(totals.estimatedHoursTotal)}</div>
          {totals.eigenleistungValue != null && (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">≈ {euro(totals.eigenleistungValue)} Wert (à {euro(data.hourlyRate)})</div>
          )}
        </Card>
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Budget-Status</div>
          <div className={`text-2xl font-bold ${over ? 'text-red-600' : 'text-emerald-600'}`}>
            {budget > 0 ? `${Math.round((totals.grandTotal / budget) * 100)} %` : '–'}
          </div>
          {over ? <Badge className="mt-1 bg-red-100 text-red-700">über Budget</Badge> : <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">im Rahmen</div>}
        </Card>
      </div>

      {/* Kostenprognose */}
      {f && (
        <Card title="Kostenprognose (verdichtet sich mit jeder Phase)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Aktuelle Prognose (beste Schätzung)</div>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{euro(f.expected)}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Bandbreite {euro(f.optimistic)} … {euro(f.pessimistic)}
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                + Reserve {f.contingencyPercent || 0} % ({euro(f.contingencyAmount)}) → <b>{euro(f.withContingency)}</b>
              </div>
              {data.totalBudget != null &&
                (f.withContingency > data.totalBudget ? (
                  <div className="mt-1 text-xs text-red-600">≈ {euro(f.withContingency - data.totalBudget)} über Budget</div>
                ) : (
                  <div className="mt-1 text-xs text-emerald-600">≈ {euro(data.totalBudget - f.withContingency)} Luft zum Budget</div>
                ))}
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Sicherheit der Zahl</span>
                <span>{Math.round((f.fixedPct + f.committedPct) * 100)} % fix/beauftragt</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="bg-emerald-500" style={{ width: `${f.fixedPct * 100}%` }} title="Abgerechnet" />
                <div className="bg-sky-500" style={{ width: `${f.committedPct * 100}%` }} title="Beauftragt / Festpreis" />
                <div className="bg-slate-300 dark:bg-slate-500" style={{ width: `${f.openPct * 100}%` }} title="Geschätzt" />
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600">■ Abgerechnet</span>
                  <span className="text-slate-700 dark:text-slate-200">{euro(f.fixed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sky-600">■ Beauftragt / Festpreis</span>
                  <span className="text-slate-700 dark:text-slate-200">{euro(f.committed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">■ Geschätzt</span>
                  <span className="text-slate-700 dark:text-slate-200">{euro(f.open)}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Prognose = Ist (wo bekannt), sonst Soll. Je mehr Positionen „abgerechnet" sind, desto näher am Endpreis — Reserve &
            Bandbreite decken Nachträge/Unvorhergesehenes. Reifegrad je Position setzt du in der Aufgabe, den Puffer in den
            Einstellungen.
          </p>
        </Card>
      )}

      {/* Kategorien */}
      <Card title="Nach Kategorie">
        <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          {CATS.map((c) => {
            const v = totals.byCategory[c];
            const pct = (v / grand) * 100;
            return pct > 0 ? <div key={c} className={CATEGORY_BAR[c]} style={{ width: `${pct}%` }} title={CATEGORY_LABEL[c]} /> : null;
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATS.map((c) => (
            <div key={c} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
              <Badge className={CATEGORY_BADGE[c]}>{CATEGORY_LABEL[c]}</Badge>
              <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{euro(totals.byCategory[c])}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pro Phase */}
      <Card title="Nach Phase">
        <div className="space-y-3">
          {data.byPhase.map((p) => (
            <div key={p.phaseId} className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 p-3">
                <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-100">{p.title}</span>
                <span className="shrink-0 text-right">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{euro(p.total)}</span>
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">Soll {euro(p.planned)}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 text-sm sm:grid-cols-4">
                {CATS.map((c) =>
                  p.byCategory[c] > 0 ? (
                    <div key={c} className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs text-slate-500 dark:text-slate-400">{CATEGORY_LABEL[c]}</span>
                      <span className="text-slate-700 dark:text-slate-200">{euro(p.byCategory[c])}</span>
                    </div>
                  ) : null,
                )}
                {p.estimatedHours > 0 && (
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Eigenleistung</span>
                    <span className="text-slate-700 dark:text-slate-200">{fmtHours(p.estimatedHours)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Beträge sind teils Platzhalter. Die konkrete Grundpreis-Aufteilung und Bemusterungs-Positionen kannst du je
          Aufgabe bzw. unter „Pauschalen" in der Phase eintragen.
        </p>
      </Card>

      {/* Kostenstand-Verlauf */}
      <Card
        title="Kostenstand-Verlauf"
        actions={
          <Button variant="secondary" onClick={saveSnapshot} disabled={savingSnap}>
            {savingSnap ? 'Sichere…' : '+ Kostenstand sichern'}
          </Button>
        }
      >
        {snapList.length === 0 ? (
          <EmptyState>
            Noch kein Kostenstand gesichert. Sichere jetzt einen — oder er entsteht automatisch, sobald eine Phase komplett
            erledigt ist. So seht ihr, wie sich der Preis über die Phasen entwickelt.
          </EmptyState>
        ) : (
          <>
            <div className="mb-3 flex h-24 items-end gap-1">
              {snapList.map((s) => {
                const v = s.withContingency || s.expected;
                return (
                  <div
                    key={s.id}
                    className="min-w-[8px] flex-1 rounded-t bg-brand"
                    style={{ height: `${Math.max(2, (v / maxSnap) * 100)}%` }}
                    title={`${s.label}: ${euro(v)}`}
                  />
                );
              })}
            </div>
            <ul className="space-y-1">
              {snapList.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-900 p-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate font-medium text-slate-800 dark:text-slate-100">
                      {s.label}
                      {s.auto && <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">auto</Badge>}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {fmtDate(s.createdAt)} · Prognose {euro(s.expected)} · inkl. Reserve {euro(s.withContingency)}
                    </div>
                  </div>
                  <button onClick={() => delSnapshot(s.id)} className="shrink-0 text-xs text-slate-400 hover:text-red-600" aria-label="Kostenstand löschen">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
