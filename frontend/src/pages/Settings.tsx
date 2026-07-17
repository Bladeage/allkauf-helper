import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import { useData } from '../context/DataContext';
import type { ProjectSettings } from '../types';
import { Spinner, Card, Button, Input, Select, Field, ErrorBox, PageHeader, Badge } from '../components/ui';
import { toInputDate } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useTheme, FONTS, SIZES, type ThemeMode, type FontKey, type SizeKey } from '../context/ThemeContext';
import { useLang, useT, type Lang } from '../i18n/LanguageContext';
import TwoFactorCard from '../components/TwoFactorCard';
import PasswordChangeCard from '../components/PasswordChangeCard';
import OpenIdLinkCard from '../components/OpenIdLinkCard';

export default function Settings() {
  const { data, loading, error } = useFetch<ProjectSettings>('/settings');
  const { config } = useData();
  const [form, setForm] = useState({
    projectName: '',
    livingAreaSqm: '',
    totalBudget: '',
    projectStart: '',
    projectEnd: '',
    handoverDate: '',
    hourlyRateEigenleistung: '',
    contingencyPercent: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  const t = useT();
  const { mode, font, size, setMode, setFont, setSize } = useTheme();
  const { lang, setLang } = useLang();

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
      contingencyPercent: data.contingencyPercent != null ? String(data.contingencyPercent) : '',
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
        projectName: form.projectName.trim() || 'Fertighaus-Helfer',
        livingAreaSqm: num(form.livingAreaSqm),
        totalBudget: num(form.totalBudget),
        projectStart: form.projectStart || null,
        projectEnd: form.projectEnd || null,
        handoverDate: form.handoverDate || null,
        hourlyRateEigenleistung: num(form.hourlyRateEigenleistung),
        contingencyPercent: num(form.contingencyPercent),
      });
      setSaved(true);
      toast.success(t('Einstellungen gespeichert'));
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
      <PageHeader title={t('Einstellungen')} subtitle={t('Projektdaten, Budget und Eigenleistungs-Stundensatz')} />
      {error && <ErrorBox>{error}</ErrorBox>}

      <Card title={t('Darstellung')}>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{t('Modus')}</div>
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    mode === m
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {m === 'light' ? t('☀️ Hell') : m === 'dark' ? t('🌙 Dunkel') : t('🖥️ System')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{t('Sprache / Language')}</div>
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
              {(['de', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    lang === l
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {l === 'de' ? t('🇩🇪 Deutsch') : t('🇬🇧 English')}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Schriftart')}>
              <Select value={font} onChange={(e) => setFont(e.target.value as FontKey)}>
                {(Object.keys(FONTS) as FontKey[]).map((k) => (
                  <option key={k} value={k}>
                    {t(FONTS[k].label)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Schriftgröße')}>
              <Select value={size} onChange={(e) => setSize(e.target.value as SizeKey)}>
                {(Object.keys(SIZES) as SizeKey[]).map((k) => (
                  <option key={k} value={k}>
                    {t(SIZES[k].label)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Design wird lokal auf diesem Gerät gespeichert.')}</p>
        </div>
      </Card>

      <TwoFactorCard />

      <PasswordChangeCard />

      <OpenIdLinkCard />

      <Card title={t('Projekt')}>
        <div className="space-y-3">
          <Field label={t('Projektname')}>
            <Input value={form.projectName} onChange={(e) => up('projectName', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Wohnfläche (m²)')}>
              <Input type="number" min="0" inputMode="decimal" value={form.livingAreaSqm} onChange={(e) => up('livingAreaSqm', e.target.value)} />
            </Field>
            <Field label={t('Gesamtbudget (€)')}>
              <Input type="number" min="0" inputMode="decimal" value={form.totalBudget} onChange={(e) => up('totalBudget', e.target.value)} />
            </Field>
            <Field label={t('Projektstart (Gantt)')}>
              <Input type="date" value={form.projectStart} onChange={(e) => up('projectStart', e.target.value)} />
            </Field>
            <Field label={t('Projektende (Gantt)')}>
              <Input type="date" value={form.projectEnd} onChange={(e) => up('projectEnd', e.target.value)} />
            </Field>
            <Field label={t('Übergabe/Abnahme (Start Gewährleistung)')}>
              <Input type="date" value={form.handoverDate} onChange={(e) => up('handoverDate', e.target.value)} />
            </Field>
            <Field label={t('Stundensatz Eigenleistung (€/h)')}>
              <Input type="number" min="0" inputMode="decimal" value={form.hourlyRateEigenleistung} onChange={(e) => up('hourlyRateEigenleistung', e.target.value)} />
            </Field>
            <Field label={t('Puffer / Reserve (%)')}>
              <Input type="number" min="0" inputMode="decimal" value={form.contingencyPercent} onChange={(e) => up('contingencyPercent', e.target.value)} placeholder={t('z. B. 10')} />
            </Field>
          </div>
          {err && <ErrorBox>{err}</ErrorBox>}
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={busy}>
              {busy ? t('Speichern…') : t('Speichern')}
            </Button>
            {saved && <span className="text-sm text-emerald-600">{t('✓ Gespeichert')}</span>}
          </div>
        </div>
      </Card>

      <Card title={t('Module')}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">{t('Haus-Planungsmodul (experimentell)')}</span>
          <Badge className={config?.enableHouseModule ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}>
            {config?.enableHouseModule ? t('aktiv') : t('deaktiviert')}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('Umschaltbar über die Umgebungsvariable')} <code className="rounded bg-slate-100 dark:bg-slate-700 px-1">ENABLE_HOUSE_MODULE</code> {t('(true/false) in der')}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1">.env</code> {t('und Neustart des Backends.')}
        </p>
      </Card>
    </div>
  );
}
