import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { PhaseDetail as PD, Milestone, CostCategory } from '../types';
import { Spinner, ProgressBar, Badge, Card, Button, Input, Textarea, Select, Field, ErrorBox, EmptyState, Modal } from '../components/ui';
import { STATUS_BADGE, STATUS_LABEL, CATEGORY_LABEL, fmtDate, toInputDate, euro } from '../lib/format';
import TaskItem from '../components/TaskItem';
import NoteEditor from '../components/NoteEditor';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const CATS: CostCategory[] = ['allkauf_paket', 'bemusterung_extra', 'eigenleistung_material', 'sonstiges'];

export default function PhaseDetail() {
  const { id } = useParams();
  const { data: phase, loading, error, reload } = useFetch<PD>(`/phases/${id}`, [id]);
  const { data: milestones } = useFetch<Milestone[]>('/milestones');

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!phase) return <EmptyState>Phase nicht gefunden.</EmptyState>;

  const ms = milestones ?? [];

  return (
    <div className="space-y-4">
      <Link to="/phases" className="text-sm text-slate-500 hover:text-brand-700">
        ← Alle Phasen
      </Link>

      <Card>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{phase.title}</h1>
            {phase.description && <p className="mt-1 text-sm text-slate-500">{phase.description}</p>}
          </div>
          <Badge className={STATUS_BADGE[phase.status]}>{STATUS_LABEL[phase.status]}</Badge>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={phase.progress} className="flex-1" />
          <span className="whitespace-nowrap text-xs font-medium text-slate-500">
            {phase.doneCount}/{phase.taskCount} erledigt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>Start: {fmtDate(phase.startDate)}</span>
          <span>Ende: {fmtDate(phase.endDate)}</span>
          {phase.budget != null && <span>Budget: {euro(phase.budget)}</span>}
          <button onClick={() => setShowEdit(true)} className="text-brand-700 hover:underline">
            bearbeiten
          </button>
        </div>
      </Card>

      <Card
        title={`Checkliste (${phase.taskCount})`}
        actions={
          <Button variant="secondary" onClick={() => setShowAdd(true)}>
            + Aufgabe
          </Button>
        }
      >
        <div className="space-y-2">
          {phase.tasks.length === 0 && <EmptyState>Noch keine Aufgaben.</EmptyState>}
          {phase.tasks.map((t) => (
            <TaskItem key={`${t.id}:${t.updatedAt ?? ''}`} task={t} milestones={ms} onChanged={reload} />
          ))}
        </div>
      </Card>

      <LumpSums phase={phase} onChanged={reload} />

      <Card title="Notizen zur Phase">
        <NoteEditor phaseId={phase.id} />
      </Card>

      {showAdd && <AddTaskModal phaseId={phase.id} onClose={() => setShowAdd(false)} onDone={reload} />}
      {showEdit && <EditPhaseModal phase={phase} onClose={() => setShowEdit(false)} onDone={reload} />}
    </div>
  );
}

function LumpSums({ phase, onChanged }: { phase: PD; onChanged: () => void }) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  async function add() {
    if (!label.trim() || amount.trim() === '') return;
    setBusy(true);
    setErr(null);
    try {
      await api.post('/lump-sums', { phaseId: phase.id, label: label.trim(), amount: Number(amount) });
      toast.success('Pauschale hinzugefügt');
      setLabel('');
      setAmount('');
      onChanged();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }
  async function del(lid: number) {
    if (!(await confirm({ message: 'Pauschale wirklich löschen?', danger: true, confirmLabel: 'Löschen' }))) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/lump-sums/${lid}`);
      toast.success('Pauschale gelöscht');
      onChanged();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="allkauf-Pauschalen (Grundpreis-Anteil)">
      <div className="space-y-2">
        {phase.lumpSums.length === 0 && <EmptyState>Keine Pauschale hinterlegt.</EmptyState>}
        {phase.lumpSums.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-sm">
            <span className="text-slate-700">{l.label}</span>
            <span className="flex items-center gap-3">
              <b className="text-slate-800">{euro(l.amount)}</b>
              <button onClick={() => del(l.id)} className="text-xs text-slate-500 hover:text-red-600">
                löschen
              </button>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <Input aria-label="Bezeichnung der Pauschale" placeholder="Bezeichnung (z. B. Rohbau-Anteil)" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="w-32">
          <Input aria-label="Betrag in Euro" type="number" min="0" inputMode="decimal" placeholder="€" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={add} disabled={busy}>
          Hinzufügen
        </Button>
      </div>
      {err && <ErrorBox>{err}</ErrorBox>}
    </Card>
  );
}

function AddTaskModal({ phaseId, onClose, onDone }: { phaseId: number; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costCategory, setCostCategory] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  async function submit() {
    if (!title.trim()) {
      setErr('Titel erforderlich');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post('/tasks', {
        phaseId,
        title: title.trim(),
        description: description.trim() || null,
        costCategory: costCategory || null,
        costAmount: costAmount.trim() === '' ? null : Number(costAmount),
        dueDate: dueDate || null,
      });
      toast.success('Aufgabe hinzugefügt');
      onDone();
      onClose();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Eigene Aufgabe hinzufügen" busy={busy}>
      <div className="space-y-3">
        <Field label="Titel">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <Field label="Beschreibung (optional)">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kostenart">
            <Select value={costCategory} onChange={(e) => setCostCategory(e.target.value)}>
              <option value="">– keine –</option>
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Betrag (€)">
            <Input type="number" min="0" inputMode="decimal" value={costAmount} onChange={(e) => setCostAmount(e.target.value)} />
          </Field>
        </div>
        <Field label="Fälligkeit (optional)">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={busy}>
            Hinzufügen
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditPhaseModal({ phase, onClose, onDone }: { phase: PD; onClose: () => void; onDone: () => void }) {
  const [description, setDescription] = useState(phase.description ?? '');
  const [startDate, setStartDate] = useState(toInputDate(phase.startDate));
  const [endDate, setEndDate] = useState(toInputDate(phase.endDate));
  const [budget, setBudget] = useState(phase.budget != null ? String(phase.budget) : '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      await api.patch(`/phases/${phase.id}`, {
        description: description.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
        budget: budget.trim() === '' ? null : Number(budget),
      });
      toast.success('Phase gespeichert');
      onDone();
      onClose();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Phase bearbeiten" busy={busy}>
      <div className="space-y-3">
        <Field label="Beschreibung">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start (Gantt)">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Ende (Gantt)">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Phasen-Budget (€, optional)">
          <Input type="number" min="0" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </Field>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={busy}>
            Speichern
          </Button>
        </div>
      </div>
    </Modal>
  );
}
