import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { Note } from '../types';
import { Button, Textarea, ErrorBox } from './ui';
import { fmtDateTime } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export default function NoteEditor({ phaseId, taskId }: { phaseId?: number; taskId?: number }) {
  const q = phaseId ? `/notes?phaseId=${phaseId}` : `/notes?taskId=${taskId}`;
  const { data, reload } = useFetch<Note[]>(q, [q]);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function add() {
    if (!text.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.post('/notes', { phaseId: phaseId ?? null, taskId: taskId ?? null, content: text.trim() });
      toast.success('Notiz gespeichert');
      setText('');
      reload();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function del(id: number) {
    if (!(await confirm({ message: 'Notiz löschen?', danger: true, confirmLabel: 'Löschen' }))) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Notiz gelöscht');
      reload();
    } catch (e) {
      setErr(apiError(e));
    }
  }

  return (
    <div className="space-y-2">
      {data?.map((n) => (
        <div key={n.id} className="group rounded-lg bg-slate-50 dark:bg-slate-900 p-2 text-sm">
          <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{n.content}</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{fmtDateTime(n.createdAt)}</span>
            <button
              onClick={() => del(n.id)}
              className="rounded px-1 py-0.5 hover:text-red-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              löschen
            </button>
          </div>
        </div>
      ))}
      <div className="flex items-end gap-2">
        <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Notiz hinzufügen…" />
        <Button variant="secondary" onClick={add} disabled={busy} aria-label="Notiz hinzufügen">
          +
        </Button>
      </div>
      {err && <ErrorBox>{err}</ErrorBox>}
    </div>
  );
}
