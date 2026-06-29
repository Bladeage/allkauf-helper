import { useRef, useState, type ChangeEvent } from 'react';
import { api, apiError } from '../lib/api';
import type { Attachment } from '../types';
import { useFetch } from '../hooks/useFetch';
import { Spinner, Button, ErrorBox } from './ui';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

type ParentKey = 'taskId' | 'phaseId' | 'defectId' | 'diaryEntryId';

// Wiederverwendbar: genau eine Eltern-ID übergeben (taskId | phaseId | defectId | diaryEntryId).
export default function AttachmentList(props: {
  taskId?: number;
  phaseId?: number;
  defectId?: number;
  diaryEntryId?: number;
}) {
  const entry = (Object.entries(props).filter(([, v]) => v != null) as [ParentKey, number][])[0];
  const [key, id] = entry;
  const { data, loading, reload } = useFetch<Attachment[]>(`/attachments?${key}=${id}`);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const isImage = (m: string) => m.startsWith('image/');
  const fileUrl = (a: Attachment) => `/api/attachments/${a.id}/file`;
  const size = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append(key, String(id));
      await api.post('/attachments', fd);
      toast.success('Anhang hochgeladen');
      reload();
    } catch (e2) {
      setErr(apiError(e2));
    } finally {
      setBusy(false);
    }
  }

  async function del(a: Attachment) {
    if (!(await confirm({ message: `Anhang „${a.originalName}“ löschen?`, danger: true, confirmLabel: 'Löschen' }))) return;
    try {
      await api.delete(`/attachments/${a.id}`);
      toast.success('Anhang gelöscht');
      reload();
    } catch (e2) {
      setErr(apiError(e2));
    }
  }

  const list = data ?? [];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">Anhänge{list.length > 0 ? ` (${list.length})` : ''}</span>
        <Button variant="secondary" type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'Lädt…' : '+ Datei/Foto'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={onPick}
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
      </div>
      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <p className="text-xs text-slate-400">Noch keine Anhänge.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {list.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-lg ring-1 ring-slate-200">
              <a href={fileUrl(a)} target="_blank" rel="noreferrer" className="block" title={a.originalName}>
                {isImage(a.mimeType) ? (
                  <img src={fileUrl(a)} alt={a.originalName} loading="lazy" className="h-24 w-full object-cover" />
                ) : (
                  <div className="flex h-24 w-full flex-col items-center justify-center bg-slate-50 p-2 text-center">
                    <span className="text-2xl">📄</span>
                    <span className="mt-1 w-full truncate text-[11px] text-slate-600">{a.originalName}</span>
                  </div>
                )}
              </a>
              <div className="flex items-center justify-between gap-1 px-1.5 py-1 text-[11px] text-slate-500">
                <span className="truncate">{size(a.size)}</span>
                <button
                  type="button"
                  onClick={() => del(a)}
                  className="text-slate-400 hover:text-red-600"
                  aria-label={`Anhang ${a.originalName} löschen`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {err && (
        <div className="mt-2">
          <ErrorBox>{err}</ErrorBox>
        </div>
      )}
    </div>
  );
}
