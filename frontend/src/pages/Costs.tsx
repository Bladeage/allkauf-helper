import { useFetch } from '../hooks/useFetch';
import type { CostSummary, CostCategory } from '../types';
import { Spinner, Card, Badge, PageHeader, ErrorBox } from '../components/ui';
import { euro, fmtHours, CATEGORY_LABEL, CATEGORY_BADGE, CATEGORY_BAR } from '../lib/format';

const CATS: CostCategory[] = ['allkauf_paket', 'bemusterung_extra', 'eigenleistung_material', 'sonstiges'];

export default function Costs() {
  const { data, loading, error } = useFetch<CostSummary>('/costs/summary');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!data) return null;

  const { totals } = data;
  const budget = data.totalBudget ?? totals.plannedTotal;
  const over = budget > 0 && totals.grandTotal > budget;
  const grand = totals.grandTotal || 1;

  return (
    <div className="space-y-4">
      <PageHeader title="Kosten" subtitle="allkauf-Grundpreis · Bemusterung · Eigenleistung · Sonstiges" />

      {/* Summen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs text-slate-400">Ist-Kosten (inkl. Pauschalen)</div>
          <div className="text-2xl font-bold text-slate-800">{euro(totals.grandTotal)}</div>
          <div className="mt-1 text-xs text-slate-400">davon bezahlt: {euro(totals.paidTotal)}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-400">Geplant (Soll)</div>
          <div className="text-2xl font-bold text-slate-800">{euro(totals.plannedTotal)}</div>
          {data.totalBudget != null && <div className="mt-1 text-xs text-slate-400">Gesamtbudget: {euro(data.totalBudget)}</div>}
        </Card>
        <Card>
          <div className="text-xs text-slate-400">Eigenleistung (Stunden)</div>
          <div className="text-2xl font-bold text-slate-800">{fmtHours(totals.estimatedHoursTotal)}</div>
          {totals.eigenleistungValue != null && (
            <div className="mt-1 text-xs text-slate-400">≈ {euro(totals.eigenleistungValue)} Wert (à {euro(data.hourlyRate)})</div>
          )}
        </Card>
        <Card>
          <div className="text-xs text-slate-400">Budget-Status</div>
          <div className={`text-2xl font-bold ${over ? 'text-red-600' : 'text-emerald-600'}`}>
            {budget > 0 ? `${Math.round((totals.grandTotal / budget) * 100)} %` : '–'}
          </div>
          {over ? <Badge className="mt-1 bg-red-100 text-red-700">über Budget</Badge> : <div className="mt-1 text-xs text-slate-400">im Rahmen</div>}
        </Card>
      </div>

      {/* Kategorien */}
      <Card title="Nach Kategorie">
        <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          {CATS.map((c) => {
            const v = totals.byCategory[c];
            const pct = (v / grand) * 100;
            return pct > 0 ? <div key={c} className={CATEGORY_BAR[c]} style={{ width: `${pct}%` }} title={CATEGORY_LABEL[c]} /> : null;
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATS.map((c) => (
            <div key={c} className="rounded-lg bg-slate-50 p-2">
              <Badge className={CATEGORY_BADGE[c]}>{CATEGORY_LABEL[c]}</Badge>
              <div className="mt-1 font-semibold text-slate-800">{euro(totals.byCategory[c])}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pro Phase */}
      <Card title="Nach Phase">
        <div className="space-y-3">
          {data.byPhase.map((p) => (
            <div key={p.phaseId} className="rounded-xl ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-3">
                <span className="font-medium text-slate-800">{p.title}</span>
                <span className="text-right">
                  <span className="font-semibold text-slate-800">{euro(p.total)}</span>
                  <span className="ml-2 text-xs text-slate-400">Soll {euro(p.planned)}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 text-sm sm:grid-cols-4">
                {CATS.map((c) =>
                  p.byCategory[c] > 0 ? (
                    <div key={c} className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs text-slate-500">{CATEGORY_LABEL[c]}</span>
                      <span className="text-slate-700">{euro(p.byCategory[c])}</span>
                    </div>
                  ) : null,
                )}
                {p.estimatedHours > 0 && (
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-slate-500">Eigenleistung</span>
                    <span className="text-slate-700">{fmtHours(p.estimatedHours)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Beträge sind teils Platzhalter. Die konkrete allkauf-Grundpreis-Aufteilung und Bemusterungs-Positionen kannst du je
          Aufgabe bzw. unter „Pauschalen" in der Phase eintragen.
        </p>
      </Card>
    </div>
  );
}
