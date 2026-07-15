import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { Contact } from '../types';
import { Spinner, Card, Button, Input, Textarea, Field, Modal, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useT } from '../i18n/LanguageContext';

const EMPTY = { name: '', role: '', company: '', phone: '', email: '', address: '', note: '' };

export default function Contacts() {
  const t = useT();
  const { data, loading, error, reload } = useFetch<Contact[]>('/contacts');
  const [edit, setEdit] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  function openNew() {
    setEdit(null);
    setForm(EMPTY);
    setErr(null);
    setShowForm(true);
  }
  function openEdit(c: Contact) {
    setEdit(c);
    setForm({
      name: c.name,
      role: c.role ?? '',
      company: c.company ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      note: c.note ?? '',
    });
    setErr(null);
    setShowForm(true);
  }
  async function save() {
    if (!form.name.trim()) {
      setErr(t('Name ist erforderlich.'));
      return;
    }
    setBusy(true);
    setErr(null);
    const payload = {
      name: form.name.trim(),
      role: form.role || null,
      company: form.company || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      note: form.note || null,
    };
    try {
      if (edit) await api.patch(`/contacts/${edit.id}`, payload);
      else await api.post('/contacts', payload);
      toast.success(t('Kontakt gespeichert'));
      setShowForm(false);
      reload();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }
  async function del(c: Contact) {
    if (!(await confirm({ message: t('Kontakt „{name}“ löschen?', { name: c.name }), danger: true, confirmLabel: t('Löschen') }))) return;
    try {
      await api.delete(`/contacts/${c.id}`);
      toast.success(t('Kontakt gelöscht'));
      reload();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  if (loading) return <Spinner />;
  const list = data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title={t('Kontakte')} subtitle={t('Bauleiter, Gewerke, Ämter, Versorger')} actions={<Button onClick={openNew}>{t('+ Kontakt')}</Button>} />
      {error && <ErrorBox>{error}</ErrorBox>}
      {list.length === 0 ? (
        <EmptyState>{t('Noch keine Kontakte.')}</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</div>
                  {(c.role || c.company) && <div className="text-xs text-slate-500 dark:text-slate-400">{[c.role, c.company].filter(Boolean).join(' · ')}</div>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={t('{name} bearbeiten', { name: c.name })}>
                    ✏️
                  </button>
                  <button onClick={() => del(c)} className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={t('{name} löschen', { name: c.name })}>
                    🗑️
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {c.phone && (
                  <div>
                    <a href={`tel:${c.phone}`} className="text-brand-700 dark:text-brand-300 hover:underline">
                      📞 {c.phone}
                    </a>
                  </div>
                )}
                {c.email && (
                  <div>
                    <a href={`mailto:${c.email}`} className="text-brand-700 dark:text-brand-300 hover:underline">
                      ✉️ {c.email}
                    </a>
                  </div>
                )}
                {c.address && <div className="text-slate-600 dark:text-slate-300">📍 {c.address}</div>}
                {c.note && <div className="text-slate-500 dark:text-slate-400">{c.note}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={edit ? t('Kontakt bearbeiten') : t('Kontakt anlegen')} busy={busy}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Name')}>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label={t('Rolle/Gewerk')}>
              <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
            </Field>
            <Field label={t('Firma')}>
              <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            </Field>
            <Field label={t('Telefon')}>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label={t('E-Mail')}>
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label={t('Adresse')}>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </Field>
          </div>
          <Field label={t('Notiz')}>
            <Textarea rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </Field>
          {err && <ErrorBox>{err}</ErrorBox>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              {t('Abbrechen')}
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? t('Speichern…') : t('Speichern')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
