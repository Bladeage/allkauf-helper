import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import type { HouseArea } from '../types';
import { Spinner, Button, Input, Textarea, Field, Modal, PageHeader, EmptyState, ErrorBox } from '../components/ui';

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

  async function save() {
    if (!name.trim()) {
      setErr('Name erforderlich');
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
      onDone();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!area || !onDeleted) return;
    if (!confirm('Bereich löschen?')) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/house-areas/${area.id}`);
      onDeleted();
    } catch (e) {
      setErr(apiError(e));
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={area ? 'Bereich bearbeiten' : 'Bereich hinzufügen'}>
      <div className="space-y-3">
        <div className="grid grid-cols-[4rem_1fr] gap-3">
          <Field label="Icon">
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🛁" />
          </Field>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <Field label="Kurzbeschreibung">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Planungsnotizen / Ideen">
          <Textarea rows={6} value={planningNotes} onChange={(e) => setPlanningNotes(e.target.value)} placeholder="Ideen, Maße, Produkt-Links…" />
        </Field>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="flex items-center justify-between">
          {area && onDeleted ? (
            <Button variant="danger" onClick={del} disabled={busy}>
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={save} disabled={busy}>
              Speichern
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

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Haus-Planung"
        subtitle="Experimentell — Bereiche, Ideen & Notizen"
        actions={
          <Button variant="secondary" onClick={() => setAdding(true)}>
            + Bereich
          </Button>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data?.map((a) => (
          <button
            key={a.id}
            onClick={() => setActive(a)}
            className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-200"
          >
            <span className="text-3xl">{a.icon || '🏠'}</span>
            <span className="text-sm font-medium text-slate-700">{a.name}</span>
            {a.planningNotes && <span className="text-[10px] text-slate-400">notiert</span>}
          </button>
        ))}
      </div>
      {data && !error && data.length === 0 && <EmptyState>Noch keine Bereiche.</EmptyState>}

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
