import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { DiaryEntry } from '../types';
import { Spinner, Badge, Button, Input, Textarea, Field, Modal, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { fmtDate } from '../lib/format';
import AttachmentList from '../components/AttachmentList';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useT } from '../i18n/LanguageContext';

const todayInput = () => new Date().toISOString().slice(0, 10);

function EntryCard({ e, reload }: { e: DiaryEntry; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();

  async function del() {
    if (!(await confirm({ message: t('Eintrag löschen?'), danger: true, confirmLabel: t('Löschen') }))) return;
    try {
      await api.delete(`/diary/${e.id}`);
      toast.success(t('Eintrag gelöscht'));
      reload();
    } catch (e2) {
      setErr(apiError(e2));
    }
  }

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
      <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-800 dark:text-slate-100">
            {fmtDate(e.entryDate)}
            {e.title ? ` — ${e.title}` : ''}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {e.trade && <Badge className="bg-sky-100 text-sky-700">{e.trade}</Badge>}
            {e.weather && <Badge className="bg-amber-100 text-amber-800">{e.weather}</Badge>}
            {e.attachments && e.attachments.length > 0 && <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">📎 {e.attachments.length}</Badge>}
          </div>
        </div>
        <span className="select-none text-xs text-slate-500 dark:text-slate-400" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 p-3">
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{e.content}</p>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
            <AttachmentList diaryEntryId={e.id} />
          </div>
          {err && <ErrorBox>{err}</ErrorBox>}
          <div className="flex justify-end">
            <Button variant="danger" onClick={del}>
              {t('Löschen')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Diary() {
  const { data, loading, error, reload } = useFetch<DiaryEntry[]>('/diary');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ entryDate: todayInput(), weather: '', trade: '', title: '', content: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const t = useT();

  async function add() {
    if (!form.content.trim()) {
      setErr(t('Bitte einen Text eingeben.'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post('/diary', {
        entryDate: form.entryDate || todayInput(),
        weather: form.weather || null,
        trade: form.trade || null,
        title: form.title || null,
        content: form.content.trim(),
      });
      toast.success(t('Eintrag gespeichert'));
      setForm({ entryDate: todayInput(), weather: '', trade: '', title: '', content: '' });
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

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Bautagebuch')}
        subtitle={t('{n} Eintrag/Einträge', { n: list.length })}
        actions={
          <div className="flex gap-2">
            <a
              href="/api/exports/diary.pdf"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              ⬇ PDF
            </a>
            <Button onClick={() => setShowAdd(true)}>{t('+ Eintrag')}</Button>
          </div>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {list.length === 0 ? (
        <EmptyState>{t('Noch keine Einträge. Dokumentiere täglich Fortschritt, Wetter, Gewerk und besondere Vorkommnisse — das ist ein wichtiger Nachweis.')}</EmptyState>
      ) : (
        <div className="space-y-2">
          {list.map((e) => (
            <EntryCard key={e.id} e={e} reload={reload} />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('Tagebuch-Eintrag')} busy={busy}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Datum')}>
              <Input type="date" value={form.entryDate} onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))} />
            </Field>
            <Field label={t('Gewerk')}>
              <Input value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))} placeholder={t('z. B. Estrich')} />
            </Field>
            <Field label={t('Wetter')}>
              <Input value={form.weather} onChange={(e) => setForm((f) => ({ ...f, weather: e.target.value }))} placeholder={t('sonnig, 18 °C')} />
            </Field>
            <Field label={t('Titel (optional)')}>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
          </div>
          <Field label={t('Was wurde gemacht?')}>
            <Textarea rows={4} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
          </Field>
          {err && <ErrorBox>{err}</ErrorBox>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              {t('Abbrechen')}
            </Button>
            <Button onClick={add} disabled={busy}>
              {busy ? t('Speichern…') : t('Speichern')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
