import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { PaymentData, PaymentInstallment } from '../types';
import { Spinner, Card, Badge, Button, Input, Textarea, Field, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { euro, fmtDate, toInputDate } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

function Row({ it, reload }: { it: PaymentInstallment; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState({
    label: it.label,
    percent: it.percent != null ? String(it.percent) : '',
    plannedAmount: it.plannedAmount != null ? String(it.plannedAmount) : '',
    paidAmount: it.paidAmount != null ? String(it.paidAmount) : '',
    dueCondition: it.dueCondition ?? '',
    dueDate: toInputDate(it.dueDate),
    paidDate: toInputDate(it.paidDate),
    note: it.note ?? '',
  });
  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  async function togglePaid() {
    try {
      await api.patch(`/payments/${it.id}`, { isPaid: !it.isPaid });
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }
  async function save() {
    setErr(null);
    try {
      await api.patch(`/payments/${it.id}`, {
        label: f.label,
        percent: num(f.percent),
        plannedAmount: num(f.plannedAmount),
        paidAmount: num(f.paidAmount),
        dueCondition: f.dueCondition || null,
        dueDate: f.dueDate || null,
        paidDate: f.paidDate || null,
        note: f.note || null,
      });
      toast.success('Rate gespeichert');
      setOpen(false);
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }
  async function del() {
    if (!(await confirm({ message: 'Rate löschen?', danger: true, confirmLabel: 'Löschen' }))) return;
    try {
      await api.delete(`/payments/${it.id}`);
      toast.success('Rate gelöscht');
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={it.isPaid}
          onChange={togglePaid}
          className="h-5 w-5 shrink-0 rounded border-slate-300 dark:border-slate-600 text-brand-700 dark:text-brand-300 focus:ring-brand"
          aria-label={`Bezahlt: ${it.label}`}
        />
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <div className={`font-medium ${it.isPaid ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{it.label}</div>
          {it.dueCondition && <div className="truncate text-xs text-slate-500 dark:text-slate-400">{it.dueCondition}</div>}
        </button>
        <div className="shrink-0 text-right">
          <div className="font-semibold text-slate-800 dark:text-slate-100">
            {it.plannedAmount != null ? euro(it.plannedAmount) : it.percent != null ? `${it.percent} %` : '–'}
          </div>
          {it.isPaid && <Badge className="bg-emerald-100 text-emerald-700">bezahlt{it.paidDate ? ` ${fmtDate(it.paidDate)}` : ''}</Badge>}
        </div>
      </div>
      {open && (
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 p-3">
          <Field label="Bezeichnung">
            <Input value={f.label} onChange={(e) => setF((s) => ({ ...s, label: e.target.value }))} />
          </Field>
          <Field label="Bedingung / Baufortschritt">
            <Input value={f.dueCondition} onChange={(e) => setF((s) => ({ ...s, dueCondition: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prozent (%)">
              <Input type="number" inputMode="decimal" value={f.percent} onChange={(e) => setF((s) => ({ ...s, percent: e.target.value }))} />
            </Field>
            <Field label="Soll-Betrag (€)">
              <Input type="number" inputMode="decimal" value={f.plannedAmount} onChange={(e) => setF((s) => ({ ...s, plannedAmount: e.target.value }))} />
            </Field>
            <Field label="Fällig am">
              <Input type="date" value={f.dueDate} onChange={(e) => setF((s) => ({ ...s, dueDate: e.target.value }))} />
            </Field>
            <Field label="Bezahlt am">
              <Input type="date" value={f.paidDate} onChange={(e) => setF((s) => ({ ...s, paidDate: e.target.value }))} />
            </Field>
            <Field label="Bezahlter Betrag (€)">
              <Input type="number" inputMode="decimal" value={f.paidAmount} onChange={(e) => setF((s) => ({ ...s, paidAmount: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notiz">
            <Textarea rows={2} value={f.note} onChange={(e) => setF((s) => ({ ...s, note: e.target.value }))} />
          </Field>
          {err && <ErrorBox>{err}</ErrorBox>}
          <div className="flex justify-between">
            <Button variant="danger" onClick={del}>
              Löschen
            </Button>
            <Button onClick={save}>Speichern</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Payments() {
  const { data, loading, error, reload } = useFetch<PaymentData>('/payments');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function addRow() {
    setBusy(true);
    try {
      await api.post('/payments', { label: 'Neue Rate', sortOrder: data?.installments.length ?? 0 });
      reload();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!data) return null;
  const s = data.summary;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Zahlungsplan"
        subtitle="Abschläge nach Baufortschritt (MaBV / § 650m BGB)"
        actions={
          <Button onClick={addRow} disabled={busy}>
            + Rate
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Soll gesamt</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{euro(s.plannedTotal)}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Bezahlt</div>
          <div className="text-2xl font-bold text-emerald-600">{euro(s.paidTotal)}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {s.paidCount}/{s.total} Raten
          </div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Offen</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{euro(s.openTotal)}</div>
        </Card>
      </div>
      {data.installments.length === 0 ? (
        <EmptyState>Noch keine Raten. Lege deinen vertraglichen Abschlagsplan an.</EmptyState>
      ) : (
        <div className="space-y-2">
          {data.installments.map((it) => (
            <Row key={it.id} it={it} reload={reload} />
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Die Beträge/Prozente stammen aus deinem konkreten Vertrag — bitte eintragen. Hinweis: Abschlagszahlungen sind bis zur
        Fertigstellung auf max. 90 % begrenzt; 5 % Fertigstellungssicherheit (§ 650m BGB) sind zulässig.
      </p>
    </div>
  );
}
