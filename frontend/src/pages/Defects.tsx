import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { Defect, DefectSeverity, DefectStatus } from '../types';
import { Spinner, Badge, Button, Input, Textarea, Select, Field, Modal, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { fmtDate, toInputDate } from '../lib/format';
import AttachmentList from '../components/AttachmentList';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const STATUS: DefectStatus[] = ['open', 'in_progress', 'fixed', 'rejected'];
const STATUS_LABEL: Record<DefectStatus, string> = { open: 'Offen', in_progress: 'In Arbeit', fixed: 'Behoben', rejected: 'Abgelehnt' };
const STATUS_BADGE: Record<DefectStatus, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-sky-100 text-sky-700',
  fixed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-slate-100 text-slate-500',
};
const SEV: DefectSeverity[] = ['minor', 'normal', 'major', 'critical'];
const SEV_LABEL: Record<DefectSeverity, string> = { minor: 'Gering', normal: 'Normal', major: 'Erheblich', critical: 'Kritisch' };
const SEV_BADGE: Record<DefectSeverity, string> = {
  minor: 'bg-slate-100 text-slate-600',
  normal: 'bg-sky-100 text-sky-700',
  major: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-700',
};

function DefectCard({ d, reload }: { d: Defect; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  async function patch(data: Record<string, unknown>) {
    setErr(null);
    try {
      await api.patch(`/defects/${d.id}`, data);
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }
  async function del() {
    if (!(await confirm({ message: 'Mangel löschen (inkl. Fotos)?', danger: true, confirmLabel: 'Löschen' }))) return;
    try {
      await api.delete(`/defects/${d.id}`);
      toast.success('Mangel gelöscht');
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-3 p-3">
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <div className={`font-medium ${d.status === 'fixed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{d.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className={SEV_BADGE[d.severity]}>{SEV_LABEL[d.severity]}</Badge>
            <Badge className={STATUS_BADGE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
            {d.location && <Badge className="bg-slate-100 text-slate-600">📍 {d.location}</Badge>}
            {d.dueDate && <Badge className="bg-sky-100 text-sky-700">Frist {fmtDate(d.dueDate)}</Badge>}
            {d.attachments && d.attachments.length > 0 && <Badge className="bg-slate-100 text-slate-500">📎 {d.attachments.length}</Badge>}
          </div>
        </button>
        <span className="select-none text-xs text-slate-500" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="space-y-3 border-t border-slate-100 p-3">
          {d.description && <p className="rounded-lg bg-slate-50 p-2 text-sm text-slate-600">{d.description}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={d.status} onChange={(e) => patch({ status: e.target.value })}>
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Schwere">
              <Select value={d.severity} onChange={(e) => patch({ severity: e.target.value })}>
                {SEV.map((s) => (
                  <option key={s} value={s}>
                    {SEV_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ort/Raum">
              <Input
                defaultValue={d.location ?? ''}
                onBlur={(e) => e.target.value !== (d.location ?? '') && patch({ location: e.target.value || null })}
              />
            </Field>
            <Field label="Frist">
              <Input type="date" defaultValue={toInputDate(d.dueDate)} onChange={(e) => patch({ dueDate: e.target.value || null })} />
            </Field>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <AttachmentList defectId={d.id} />
          </div>
          {err && <ErrorBox>{err}</ErrorBox>}
          <div className="flex justify-end">
            <Button variant="danger" onClick={del}>
              Löschen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Defects() {
  const { data, loading, error, reload } = useFetch<Defect[]>('/defects');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', severity: 'normal' as DefectSeverity, dueDate: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  async function add() {
    if (!form.title.trim()) {
      setErr('Bitte einen Titel angeben.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post('/defects', {
        title: form.title.trim(),
        location: form.location || null,
        severity: form.severity,
        dueDate: form.dueDate || null,
        description: form.description || null,
      });
      toast.success('Mangel angelegt');
      setForm({ title: '', location: '', severity: 'normal', dueDate: '', description: '' });
      setShowAdd(false);
      reload();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  const list = data ?? [];
  const openCount = list.filter((d) => d.status === 'open' || d.status === 'in_progress').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mängelliste"
        subtitle={`${openCount} offen · ${list.length} gesamt`}
        actions={<Button onClick={() => setShowAdd(true)}>+ Mangel</Button>}
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {list.length === 0 ? (
        <EmptyState>Noch keine Mängel erfasst. Halte bei der Abnahme jeden Mangel mit Foto, Ort und Frist fest — wichtig für die Gewährleistung.</EmptyState>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <DefectCard key={d.id} d={d} reload={reload} />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Mangel erfassen" busy={busy}>
        <div className="space-y-3">
          <Field label="Titel">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="z. B. Kratzer Fliese Bad" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ort/Raum">
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Hauptbadezimmer" />
            </Field>
            <Field label="Schwere">
              <Select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as DefectSeverity }))}>
                {SEV.map((s) => (
                  <option key={s} value={s}>
                    {SEV_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Frist (optional)">
            <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </Field>
          <Field label="Beschreibung">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          {err && <ErrorBox>{err}</ErrorBox>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              Abbrechen
            </Button>
            <Button onClick={add} disabled={busy}>
              {busy ? 'Anlegen…' : 'Anlegen'}
            </Button>
          </div>
          <p className="text-xs text-slate-400">Fotos kannst du nach dem Anlegen direkt am Mangel-Eintrag hinzufügen.</p>
        </div>
      </Modal>
    </div>
  );
}
