import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import { useData } from '../context/DataContext';
import type { ProjectSettings } from '../types';
import { Spinner, Card, Button, Input, Field, ErrorBox, PageHeader, Badge } from '../components/ui';
import { toInputDate } from '../lib/format';

export default function Settings() {
  const { data, loading } = useFetch<ProjectSettings>('/settings');
  const { config } = useData();
  const [form, setForm] = useState({
    projectName: '',
    livingAreaSqm: '',
    totalBudget: '',
    projectStart: '',
    projectEnd: '',
    handoverDate: '',
    hourlyRateEigenleistung: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      projectName: data.projectName ?? '',
      livingAreaSqm: data.livingAreaSqm != null ? String(data.livingAreaSqm) : '',
      totalBudget: data.totalBudget != null ? String(data.totalBudget) : '',
      projectStart: toInputDate(data.projectStart),
      projectEnd: toInputDate(data.projectEnd),
      handoverDate: toInputDate(data.handoverDate),
      hourlyRateEigenleistung: data.hourlyRateEigenleistung != null ? String(data.hourlyRateEigenleistung) : '',
    });
  }, [data]);

  if (loading) return <Spinner />;

  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  async function save() {
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      await api.patch('/settings', {
        projectName: form.projectName.trim() || 'allkauf Haus-Helfer',
        livingAreaSqm: num(form.livingAreaSqm),
        totalBudget: num(form.totalBudget),
        projectStart: form.projectStart || null,
        projectEnd: form.projectEnd || null,
        handoverDate: form.handoverDate || null,
        hourlyRateEigenleistung: num(form.hourlyRateEigenleistung),
      });
      setSaved(true);
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  function up<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Einstellungen" subtitle="Projektdaten, Budget und Eigenleistungs-Stundensatz" />

      <Card title="Projekt">
        <div className="space-y-3">
          <Field label="Projektname">
            <Input value={form.projectName} onChange={(e) => up('projectName', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wohnfläche (m²)">
              <Input type="number" inputMode="decimal" value={form.livingAreaSqm} onChange={(e) => up('livingAreaSqm', e.target.value)} />
            </Field>
            <Field label="Gesamtbudget (€)">
              <Input type="number" inputMode="decimal" value={form.totalBudget} onChange={(e) => up('totalBudget', e.target.value)} />
            </Field>
            <Field label="Projektstart (Gantt)">
              <Input type="date" value={form.projectStart} onChange={(e) => up('projectStart', e.target.value)} />
            </Field>
            <Field label="Projektende (Gantt)">
              <Input type="date" value={form.projectEnd} onChange={(e) => up('projectEnd', e.target.value)} />
            </Field>
            <Field label="Übergabe/Abnahme (Start Gewährleistung)">
              <Input type="date" value={form.handoverDate} onChange={(e) => up('handoverDate', e.target.value)} />
            </Field>
            <Field label="Stundensatz Eigenleistung (€/h)">
              <Input type="number" inputMode="decimal" value={form.hourlyRateEigenleistung} onChange={(e) => up('hourlyRateEigenleistung', e.target.value)} />
            </Field>
          </div>
          {err && <ErrorBox>{err}</ErrorBox>}
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={busy}>
              {busy ? 'Speichern…' : 'Speichern'}
            </Button>
            {saved && <span className="text-sm text-emerald-600">✓ Gespeichert</span>}
          </div>
        </div>
      </Card>

      <Card title="Module">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Haus-Planungsmodul (experimentell)</span>
          <Badge className={config?.enableHouseModule ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
            {config?.enableHouseModule ? 'aktiv' : 'deaktiviert'}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Umschaltbar über die Umgebungsvariable <code className="rounded bg-slate-100 px-1">ENABLE_HOUSE_MODULE</code> (true/false) in der
          <code className="rounded bg-slate-100 px-1">.env</code> und Neustart des Backends.
        </p>
      </Card>
    </div>
  );
}
