import { useState } from 'react';
import { api, apiError } from '../lib/api';
import type { CostCategory, Milestone, Priority, Task } from '../types';
import { Badge, Button, Input, Select, Textarea, Field, ErrorBox } from './ui';
import { CATEGORY_BADGE, CATEGORY_LABEL, PRIORITY_LABEL, euro, fmtDate, toInputDate } from '../lib/format';
import NoteEditor from './NoteEditor';

const CATS: CostCategory[] = ['allkauf_paket', 'bemusterung_extra', 'eigenleistung_material', 'sonstiges'];
const PRIOS: Priority[] = ['low', 'normal', 'high', 'urgent'];

export default function TaskItem({
  task,
  milestones,
  onChanged,
}: {
  task: Task;
  milestones: Milestone[];
  onChanged: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const link = task.milestoneLinks?.[0];
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    costCategory: task.costCategory ?? '',
    costAmount: task.costAmount != null ? String(task.costAmount) : '',
    plannedAmount: task.plannedAmount != null ? String(task.plannedAmount) : '',
    estimatedHours: task.estimatedHours != null ? String(task.estimatedHours) : '',
    dueDate: toInputDate(task.dueDate),
    vendor: task.vendor ?? '',
    isPaid: task.isPaid,
    paidDate: toInputDate(task.paidDate),
    priority: task.priority as Priority,
  });
  const [mid, setMid] = useState(link ? String(link.milestoneId) : '');
  const [daysBefore, setDaysBefore] = useState(link ? String(link.daysBefore) : '56');

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const overdue = Boolean(task.effectiveDueDate && !task.isDone && new Date(task.effectiveDueDate) < todayUTC);

  async function toggleDone() {
    setBusy(true);
    setErr(null);
    try {
      await api.patch(`/tasks/${task.id}`, { isDone: !task.isDone });
      await onChanged(); // bis zum Reload „busy" halten -> kein kurzer Stale-Zustand
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  const numOrNull = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  async function save() {
    setBusy(true);
    setErr(null);
    const data: Record<string, unknown> = {
      costCategory: form.costCategory || null,
      costAmount: numOrNull(form.costAmount),
      plannedAmount: numOrNull(form.plannedAmount),
      estimatedHours: form.estimatedHours.trim() === '' ? null : Math.round(Number(form.estimatedHours)),
      dueDate: form.dueDate || null,
      vendor: form.vendor || null,
      isPaid: form.isPaid,
      paidDate: form.paidDate || null,
      priority: form.priority,
    };
    if (task.isCustom) {
      data.title = form.title;
      data.description = form.description || null;
    }
    try {
      await api.patch(`/tasks/${task.id}`, data);
      onChanged();
      setOpen(false);
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Diese Aufgabe wirklich löschen?')) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/tasks/${task.id}`);
      await onChanged();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveMilestoneLink() {
    setBusy(true);
    setErr(null);
    try {
      // Erst neuen Link anlegen, dann alten löschen — schlägt der POST fehl, bleibt die bestehende Verknüpfung erhalten
      if (mid) await api.post(`/tasks/${task.id}/milestone-link`, { milestoneId: Number(mid), daysBefore: Math.round(Number(daysBefore)) || 0 });
      if (link) await api.delete(`/tasks/${task.id}/milestone-link/${link.id}`);
      onChanged();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={task.isDone}
          onChange={toggleDone}
          disabled={busy}
          className="h-5 w-5 shrink-0 rounded border-slate-300 text-brand focus:ring-brand"
          aria-label={`Erledigt: ${task.title}`}
        />
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <div className={`font-medium ${task.isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{task.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {task.costCategory && (
              <Badge className={CATEGORY_BADGE[task.costCategory]}>
                {CATEGORY_LABEL[task.costCategory]}
                {task.costAmount != null ? ` · ${euro(task.costAmount)}` : ''}
              </Badge>
            )}
            {task.estimatedHours != null && <Badge className="bg-slate-100 text-slate-600">{task.estimatedHours} h</Badge>}
            {(task.priority === 'high' || task.priority === 'urgent') && (
              <Badge className="bg-orange-100 text-orange-700">{PRIORITY_LABEL[task.priority]}</Badge>
            )}
            {task.effectiveDueDate && (
              <Badge className={overdue ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}>
                📅 {overdue ? 'Überfällig: ' : ''}
                {fmtDate(task.effectiveDueDate)}
              </Badge>
            )}
            {task.isPaid && <Badge className="bg-emerald-100 text-emerald-700">bezahlt</Badge>}
            {task.isCustom && <Badge className="bg-violet-100 text-violet-700">ergänzt</Badge>}
            {task._count && task._count.notes > 0 && <Badge className="bg-slate-100 text-slate-500">📝 {task._count.notes}</Badge>}
          </div>
        </button>
        <span className="select-none text-xs text-slate-500" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 p-3">
          {task.isCustom ? (
            <>
              <Field label="Titel">
                <Input value={form.title} onChange={(e) => up('title', e.target.value)} />
              </Field>
              <Field label="Beschreibung">
                <Textarea rows={2} value={form.description} onChange={(e) => up('description', e.target.value)} />
              </Field>
            </>
          ) : (
            task.description && <p className="rounded-lg bg-slate-50 p-2 text-sm text-slate-600">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kostenart">
              <Select value={form.costCategory} onChange={(e) => up('costCategory', e.target.value)}>
                <option value="">– keine –</option>
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priorität">
              <Select value={form.priority} onChange={(e) => up('priority', e.target.value as Priority)}>
                {PRIOS.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ist-Betrag (€)">
              <Input type="number" min="0" inputMode="decimal" value={form.costAmount} onChange={(e) => up('costAmount', e.target.value)} />
            </Field>
            <Field label="Soll-Betrag (€)">
              <Input type="number" min="0" inputMode="decimal" value={form.plannedAmount} onChange={(e) => up('plannedAmount', e.target.value)} />
            </Field>
            <Field label="Eigenleistung (Std.)">
              <Input type="number" min="0" inputMode="numeric" value={form.estimatedHours} onChange={(e) => up('estimatedHours', e.target.value)} />
            </Field>
            <Field label="Anbieter / Firma">
              <Input value={form.vendor} onChange={(e) => up('vendor', e.target.value)} />
            </Field>
            <Field label="Fälligkeit (festes Datum)">
              <Input type="date" value={form.dueDate} onChange={(e) => up('dueDate', e.target.value)} />
            </Field>
            <Field label="Bezahlt am">
              <Input type="date" value={form.paidDate} onChange={(e) => up('paidDate', e.target.value)} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isPaid}
              onChange={(e) => up('isPaid', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            als bezahlt markiert
          </label>

          {/* Relative Fälligkeit über Meilenstein (Abschnitt 7.4) */}
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="mb-2 text-xs font-medium text-slate-500">Relative Fälligkeit (X Tage vor Meilenstein)</div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[10rem] flex-1">
                <Select value={mid} onChange={(e) => setMid(e.target.value)}>
                  <option value="">– kein Meilenstein –</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                      {m.actualDate ? ` (${fmtDate(m.actualDate)})` : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={daysBefore}
                  onChange={(e) => setDaysBefore(e.target.value)}
                  aria-label="Tage vorher"
                />
              </div>
              <Button variant="secondary" onClick={saveMilestoneLink} disabled={busy}>
                {link ? 'Aktualisieren' : 'Verknüpfen'}
              </Button>
            </div>
            {task.effectiveDueDate && (
              <div className="mt-2 text-xs text-slate-500">
                Effektive Fälligkeit: <b>{fmtDate(task.effectiveDueDate)}</b>
              </div>
            )}
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-500">Notizen</div>
            <NoteEditor taskId={task.id} />
          </div>

          {err && <ErrorBox>{err}</ErrorBox>}

          <div className="flex items-center justify-between">
            {task.isCustom ? (
              <Button variant="danger" onClick={remove} disabled={busy}>
                Löschen
              </Button>
            ) : (
              <span className="text-xs text-slate-500">Offizieller Checklisten-Punkt</span>
            )}
            <Button onClick={save} disabled={busy}>
              {busy ? 'Speichern…' : 'Speichern'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
