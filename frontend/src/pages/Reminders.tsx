import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { Reminder, Milestone } from '../types';
import { Spinner, Card, Badge, Button, Input, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { fmtDate, toInputDate } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useT } from '../i18n/LanguageContext';

function Section({ title, color, items }: { title: string; color: string; items: Reminder[] }) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <Card title={<span className={color}>{`${title} (${items.length})`}</span>}>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
            <div className="min-w-0">
              <Link to={`/phases/${r.phaseId}`} className="block truncate font-medium text-slate-800 dark:text-slate-100 hover:text-brand-700">
                {r.title}
              </Link>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                {r.phaseTitle}
                {r.hasMilestone && r.milestoneTitle ? t(' · {days} Tage vor „{name}"', { days: r.daysBefore ?? 0, name: r.milestoneTitle }) : ''}
              </div>
            </div>
            <Badge
              className={r.overdue ? 'bg-red-100 text-red-700' : r.dueThisWeek ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-700'}
            >
              {fmtDate(r.effectiveDueDate)}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MilestonesCard({ milestones, reload }: { milestones: Milestone[]; reload: () => void }) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();

  async function addM() {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.post('/milestones', { title: title.trim() });
      toast.success(t('Meilenstein angelegt'));
      setTitle('');
      reload();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }
  async function setDate(id: number, dateStr: string) {
    try {
      await api.patch(`/milestones/${id}`, { actualDate: dateStr || null });
      toast.success(t('Datum gespeichert'));
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }
  async function del(id: number) {
    if (!(await confirm({ message: t('Meilenstein löschen?'), danger: true, confirmLabel: t('Löschen') }))) return;
    try {
      await api.delete(`/milestones/${id}`);
      toast.success(t('Meilenstein gelöscht'));
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }

  return (
    <Card title={t('Meilensteine (steuern die relativen Termine)')}>
      <div className="space-y-2">
        {milestones.length === 0 && <EmptyState>{t('Keine Meilensteine.')}</EmptyState>}
        {milestones.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-800 dark:text-slate-100">{m.title}</div>
              {m._count && <div className="text-xs text-slate-500 dark:text-slate-400">{t('{count} verknüpfte Aufgabe(n)', { count: m._count.taskLinks })}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label={t('Ist-Datum {name}', { name: m.title })}
                value={toInputDate(m.actualDate)}
                onChange={(e) => setDate(m.id, e.target.value)}
                className="w-40"
              />
              <button onClick={() => del(m.id)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600">
                {t('löschen')}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <Input aria-label={t('Neuer Meilenstein')} placeholder={t('Neuer Meilenstein (z. B. Estrich fertig)')} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button variant="secondary" onClick={addM} disabled={busy}>
          {t('Anlegen')}
        </Button>
      </div>
      {err && <ErrorBox>{err}</ErrorBox>}
    </Card>
  );
}

export default function Reminders() {
  const { data: reminders, loading, error, reload } = useFetch<Reminder[]>('/reminders');
  const { data: milestones, reload: reloadM } = useFetch<Milestone[]>('/milestones');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgOk, setMsgOk] = useState(false);
  const t = useT();

  async function sendNow() {
    setSending(true);
    setMsg(null);
    try {
      const r = await api.post('/reminders/send-now');
      const d = r.data as { sent: boolean; count: number; reason?: string; error?: string };
      setMsgOk(d.sent);
      setMsg(d.sent ? t('Mail gesendet ({count} Aufgaben).', { count: d.count }) : t('Nicht gesendet: {reason}', { reason: d.reason || d.error || '—' }));
    } catch (e) {
      setMsgOk(false);
      setMsg(apiError(e));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Spinner />;
  const list = reminders ?? [];
  const overdue = list.filter((r) => r.overdue);
  const thisWeek = list.filter((r) => !r.overdue && r.dueThisWeek);
  const later = list.filter((r) => !r.overdue && !r.dueThisWeek);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Wiedervorlagen')}
        subtitle={t('Termine & relative Meilensteine — überfällig zuerst')}
        actions={
          <div className="flex gap-2">
            <a href="/api/exports/reminders.ics" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">
              ⬇ ICS
            </a>
            <Button variant="secondary" onClick={sendNow} disabled={sending}>
              {sending ? t('Sende…') : t('Test-Mail senden')}
            </Button>
          </div>
        }
      />
      {msg && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg px-3 py-2 text-sm ${msgOk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
        >
          {msg}
        </div>
      )}

      <Section title={t('Überfällig')} color="text-red-600" items={overdue} />
      <Section title={t('Diese Woche')} color="text-amber-600" items={thisWeek} />
      <Section title={t('Später')} color="text-slate-600 dark:text-slate-300" items={later} />
      {error && <ErrorBox>{error}</ErrorBox>}
      {!error && list.length === 0 && (
        <EmptyState>
          {t('Keine offenen Wiedervorlagen. Lege an einer Aufgabe ein Fälligkeitsdatum oder eine Meilenstein-Verknüpfung an.')}
        </EmptyState>
      )}

      <MilestonesCard
        milestones={milestones ?? []}
        reload={() => {
          reloadM();
          reload();
        }}
      />
    </div>
  );
}
