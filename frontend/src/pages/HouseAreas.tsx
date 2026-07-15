import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { HouseArea } from '../types';
import { Spinner, Button, Input, Textarea, Field, Modal, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useT } from '../i18n/LanguageContext';

function AreaModal({
  area,
  onClose,
  onDone,
  onDeleted,
}: {
  area?: HouseArea;
  onClose: () => void;
  onDone: () => void;
  onDeleted?: () => void;
}) {
  const [name, setName] = useState(area?.name ?? '');
  const [icon, setIcon] = useState(area?.icon ?? '');
  const [description, setDescription] = useState(area?.description ?? '');
  const [planningNotes, setPlanningNotes] = useState(area?.planningNotes ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();

  async function save() {
    if (!name.trim()) {
      setErr(t('Name erforderlich'));
      return;
    }
    setBusy(true);
    setErr(null);
    const body = {
      name: name.trim(),
      icon: icon || null,
      description: description || null,
      planningNotes: planningNotes || null,
    };
    try {
      if (area) await api.patch(`/house-areas/${area.id}`, body);
      else await api.post('/house-areas', body);
      toast.success(t('Gespeichert'));
      onDone();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!area || !onDeleted) return;
    if (!(await confirm({ message: t('Bereich löschen?'), danger: true, confirmLabel: t('Löschen') }))) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/house-areas/${area.id}`);
      toast.success(t('Bereich gelöscht'));
      onDeleted();
    } catch (e) {
      setErr(apiError(e));
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={area ? t('Bereich bearbeiten') : t('Bereich hinzufügen')} busy={busy}>
      <div className="space-y-3">
        <div className="grid grid-cols-[4rem_1fr] gap-3">
          <Field label={t('Icon')}>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🛁" />
          </Field>
          <Field label={t('Name')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <Field label={t('Kurzbeschreibung')}>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label={t('Planungsnotizen / Ideen')}>
          <Textarea rows={6} value={planningNotes} onChange={(e) => setPlanningNotes(e.target.value)} placeholder={t('Ideen, Maße, Produkt-Links…')} />
        </Field>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="flex items-center justify-between">
          {area && onDeleted ? (
            <Button variant="danger" onClick={del} disabled={busy}>
              {t('Löschen')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('Abbrechen')}
            </Button>
            <Button onClick={save} disabled={busy}>
              {t('Speichern')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function HouseAreas() {
  const { data, loading, error, reload } = useFetch<HouseArea[]>('/house-areas');
  const [active, setActive] = useState<HouseArea | null>(null);
  const [adding, setAdding] = useState(false);
  const t = useT();

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={t('Haus-Planung')}
        subtitle={t('Experimentell — Bereiche, Ideen & Notizen')}
        actions={
          <Button variant="secondary" onClick={() => setAdding(true)}>
            + {t('Bereich')}
          </Button>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data?.map((a) => (
          <button
            key={a.id}
            onClick={() => setActive(a)}
            className="flex flex-col items-center gap-1 rounded-2xl bg-white dark:bg-slate-800 p-4 text-center shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition hover:ring-brand-200"
          >
            <span className="text-3xl">{a.icon || '🏠'}</span>
            <span className="w-full break-words text-sm font-medium text-slate-700 dark:text-slate-200">{a.name}</span>
            {a.planningNotes && <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('notiert')}</span>}
          </button>
        ))}
      </div>
      {data && !error && data.length === 0 && <EmptyState>{t('Noch keine Bereiche.')}</EmptyState>}

      {active && (
        <AreaModal
          area={active}
          onClose={() => setActive(null)}
          onDone={() => {
            setActive(null);
            reload();
          }}
          onDeleted={() => {
            setActive(null);
            reload();
          }}
        />
      )}
      {adding && (
        <AreaModal
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
