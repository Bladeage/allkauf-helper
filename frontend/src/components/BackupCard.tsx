import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';
import { Card, Button, Input, Select, Field, ErrorBox, Badge, Spinner } from './ui';
import { useToast } from '../context/ToastContext';
import { useT } from '../i18n/LanguageContext';

type BackupSettings = {
  enabled: boolean;
  envDisabled: boolean;
  frequency: 'daily' | 'weekly';
  time: string;
  weekday: number;
  keep: number;
  dir: string;
};

type BackupFile = { filename: string; kind: 'db' | 'uploads'; stamp: string; size: number };
type BackupRun = { stamp: string; files: BackupFile[]; size: number };
type BackupState = { settings: BackupSettings; running: boolean; runs: BackupRun[] };

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Stempel "20260719-212150" -> "19.07.2026, 21:21 Uhr"
function fmtStamp(stamp: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(stamp);
  if (!m) return stamp;
  const [, y, mo, d, h, min] = m;
  return `${d}.${mo}.${y}, ${h}:${min} Uhr`;
}

export default function BackupCard() {
  const t = useT();
  const toast = useToast();
  const [state, setState] = useState<BackupState | null>(null);
  const [form, setForm] = useState<BackupSettings | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);

  async function load() {
    try {
      const r = await api.get<BackupState>('/backups');
      setState(r.data);
      setForm(r.data.settings);
    } catch (e) {
      setErr(apiError(e, t('Sicherungen konnten nicht geladen werden')));
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!form) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api.patch<{ settings: BackupSettings; pruned: string[]; runs: BackupRun[] }>(
        '/backups/settings',
        {
          enabled: form.enabled,
          frequency: form.frequency,
          time: form.time,
          weekday: form.weekday,
          keep: form.keep,
        },
      );
      setState((s) => (s ? { ...s, settings: r.data.settings, runs: r.data.runs } : s));
      setForm(r.data.settings);
      const extra = r.data.pruned.length ? ` ${t('Ältere Sicherungen wurden entfernt.')}` : '';
      toast.success(t('Einstellungen gespeichert.') + extra);
    } catch (e) {
      setErr(apiError(e, t('Speichern fehlgeschlagen')));
    } finally {
      setBusy(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setErr(null);
    try {
      const r = await api.post<{ runs: BackupRun[] }>('/backups/run');
      setState((s) => (s ? { ...s, runs: r.data.runs } : s));
      toast.success(t('Sicherung erstellt.'));
    } catch (e) {
      setErr(apiError(e, t('Sicherung fehlgeschlagen')));
    } finally {
      setRunning(false);
    }
  }

  async function remove(stamp: string) {
    if (!confirm(t('Diese Sicherung endgültig löschen?'))) return;
    try {
      const r = await api.delete<{ runs: BackupRun[] }>(`/backups/${stamp}`);
      setState((s) => (s ? { ...s, runs: r.data.runs } : s));
      toast.success(t('Sicherung gelöscht.'));
    } catch (e) {
      setErr(apiError(e, t('Löschen fehlgeschlagen')));
    }
  }

  if (!state || !form) {
    return (
      <Card title={t('Datensicherung')}>
        <Spinner />
      </Card>
    );
  }

  const active = form.enabled && !form.envDisabled;

  return (
    <Card title={t('Datensicherung')}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t(
            'Sichert Datenbank und alle hochgeladenen Dateien automatisch. Die Sicherungen liegen im Container-Volume — lade sie regelmäßig herunter oder spiegle sie auf ein anderes Gerät, damit sie einen Plattenausfall überleben.',
          )}
        </p>

        {form.envDisabled && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('Die Datensicherung ist per Umgebungsvariable BACKUP_ENABLED=false abgeschaltet.')}
          </div>
        )}

        {err && <ErrorBox>{err}</ErrorBox>}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            disabled={form.envDisabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          <span>{t('Automatische Sicherung aktiv')}</span>
          {active ? (
            <Badge className="bg-emerald-100 text-emerald-700">{t('an')}</Badge>
          ) : (
            <Badge className="bg-slate-200 text-slate-600">{t('aus')}</Badge>
          )}
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('Häufigkeit')}>
            <Select
              value={form.frequency}
              disabled={!form.enabled}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as 'daily' | 'weekly' })}
            >
              <option value="daily">{t('täglich')}</option>
              <option value="weekly">{t('wöchentlich')}</option>
            </Select>
          </Field>

          {form.frequency === 'weekly' && (
            <Field label={t('Wochentag')}>
              <Select
                value={String(form.weekday)}
                disabled={!form.enabled}
                onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
              >
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {t(d)}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label={t('Uhrzeit')}>
            <Input
              type="time"
              value={form.time}
              disabled={!form.enabled}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </Field>

          <Field label={t('Aufbewahren (Anzahl)')} hint={t('0 = unbegrenzt aufbewahren')}>
            <Input
              type="number"
              min={0}
              max={365}
              value={form.keep}
              onChange={(e) => setForm({ ...form, keep: Number(e.target.value) })}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={busy}>
            {busy ? t('Speichert…') : t('Einstellungen speichern')}
          </Button>
          <Button variant="secondary" onClick={runNow} disabled={running}>
            {running ? t('Sichert…') : t('Jetzt sichern')}
          </Button>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">
            {t('Vorhandene Sicherungen')}{' '}
            <span className="font-normal text-slate-500">({state.runs.length})</span>
          </h4>

          {state.runs.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t('Noch keine Sicherung vorhanden. Die erste läuft zum eingestellten Zeitpunkt — oder jetzt per Knopfdruck.')}
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {state.runs.map((run) => (
                <li key={run.stamp} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="font-medium">{fmtStamp(run.stamp)}</span>
                  <span className="text-slate-500">{fmtSize(run.size)}</span>
                  <span className="ml-auto flex flex-wrap gap-2">
                    {run.files.map((f) => (
                      // Direkter Link statt Blob: das Auth-Cookie geht mit und
                      // große Archive werden gestreamt statt in den Speicher geladen.
                      <a
                        key={f.filename}
                        href={`/api/backups/file/${f.filename}`}
                        download
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                      >
                        ⬇ {f.kind === 'db' ? t('Datenbank') : t('Dateien')} ({fmtSize(f.size)})
                      </a>
                    ))}
                    <button
                      onClick={() => remove(run.stamp)}
                      className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      aria-label={t('Sicherung löschen')}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('Ablage im Container')}: <code>{state.settings.dir}</code>
          {' · '}
          {t('Wiederherstellung: siehe README, Abschnitt „Datensicherung".')}
        </p>
      </div>
    </Card>
  );
}
