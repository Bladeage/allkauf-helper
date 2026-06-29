import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { Reminder, Milestone } from '../types';
import { Spinner, Card, Badge, Button, Input, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { fmtDate, toInputDate } from '../lib/format';

function Section({ title, color, items }: { title: string; color: string; items: Reminder[] }) {
  if (items.length === 0) return null;
  return (
    <Card title={<span className={color}>{`${title} (${items.length})`}</span>}>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2">
            <div className="min-w-0">
              <Link to={`/phases/${r.phaseId}`} className="block truncate font-medium text-slate-800 hover:text-brand">
                {r.title}
              </Link>
              <div className="truncate text-xs text-slate-400">
                {r.phaseTitle}
                {r.hasMilestone && r.milestoneTitle ? ` · ${r.daysBefore} Tage vor „${r.milestoneTitle}"` : ''}
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

  async function addM() {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.post('/milestones', { title: title.trim() });
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
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }
  async function del(id: number) {
    if (!confirm('Meilenstein löschen?')) return;
    try {
      await api.delete(`/milestones/${id}`);
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }

  return (
    <Card title="Meilensteine (steuern die relativen Termine)">
      <div className="space-y-2">
        {milestones.length === 0 && <EmptyState>Keine Meilensteine.</EmptyState>}
        {milestones.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2">
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-800">{m.title}</div>
              {m._count && <div className="text-xs text-slate-400">{m._count.taskLinks} verknüpfte Aufgabe(n)</div>}
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={toInputDate(m.actualDate)} onChange={(e) => setDate(m.id, e.target.value)} className="w-40" />
              <button onClick={() => del(m.id)} className="text-xs text-slate-400 hover:text-red-600">
                löschen
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <Input placeholder="Neuer Meilenstein (z. B. Estrich fertig)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button variant="secondary" onClick={addM} disabled={busy}>
          Anlegen
        </Button>
      </div>
      {err && <ErrorBox>{err}</ErrorBox>}
    </Card>
  );
}

export default function Reminders() {
  const { data: reminders, loading, reload } = useFetch<Reminder[]>('/reminders');
  const { data: milestones, reload: reloadM } = useFetch<Milestone[]>('/milestones');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendNow() {
    setSending(true);
    setMsg(null);
    try {
      const r = await api.post('/reminders/send-now');
      const d = r.data as { sent: boolean; count: number; reason?: string; error?: string };
      setMsg(d.sent ? `Mail gesendet (${d.count} Aufgaben).` : `Nicht gesendet: ${d.reason || d.error || '—'}`);
    } catch (e) {
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
        title="Wiedervorlagen"
        subtitle="Termine & relative Meilensteine — überfällig zuerst"
        actions={
          <Button variant="secondary" onClick={sendNow} disabled={sending}>
            {sending ? 'Sende…' : 'Test-Mail senden'}
          </Button>
        }
      />
      {msg && <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{msg}</div>}

      <Section title="Überfällig" color="text-red-600" items={overdue} />
      <Section title="Diese Woche" color="text-amber-600" items={thisWeek} />
      <Section title="Später" color="text-slate-600" items={later} />
      {list.length === 0 && (
        <EmptyState>
          Keine offenen Wiedervorlagen. Lege an einer Aufgabe ein Fälligkeitsdatum oder eine Meilenstein-Verknüpfung an.
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
