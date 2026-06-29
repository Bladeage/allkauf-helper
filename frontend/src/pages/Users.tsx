import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import type { User } from '../types';
import { Spinner, Card, Button, Input, Select, Field, Badge, Modal, PageHeader, EmptyState, ErrorBox } from '../components/ui';

function AddUserModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  async function submit() {
    if (!name.trim() || !email.trim() || password.length < 8) {
      setErr('Name, E-Mail und Passwort (mind. 8 Zeichen) erforderlich');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post('/users', { name: name.trim(), email: email.trim(), password, role });
      toast.success('Nutzer angelegt');
      onDone();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Nutzer anlegen" busy={busy}>
      <div className="space-y-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="E-Mail">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Passwort (mind. 8 Zeichen)">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Rolle">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">Nutzer</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={busy}>
            Anlegen
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  async function submit() {
    if (password.length < 8) {
      setErr('Mindestens 8 Zeichen');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/users/${user.id}/password`, { password });
      toast.success('Passwort geändert');
      onClose();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Passwort: ${user.name}`} busy={busy}>
      <div className="space-y-3">
        <Field label="Neues Passwort (mind. 8 Zeichen)">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
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

export default function Users() {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useFetch<User[]>('/users');
  const [adding, setAdding] = useState(false);
  const [pwFor, setPwFor] = useState<User | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  if (loading) return <Spinner />;

  async function setRole(u: User, role: string) {
    if (role === u.role) return;
    try {
      await api.patch(`/users/${u.id}`, { role });
      toast.success('Rolle geändert');
      reload();
    } catch (e) {
      toast.error(apiError(e));
      reload();
    }
  }

  async function del(u: User) {
    if (!(await confirm({ message: `Nutzer „${u.name}" wirklich löschen?`, danger: true, confirmLabel: 'Löschen' }))) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('Nutzer gelöscht');
      reload();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nutzer"
        subtitle="Konten verwalten (nur für Admins)"
        actions={
          <Button variant="secondary" onClick={() => setAdding(true)}>
            + Nutzer
          </Button>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}

      <Card>
        <div className="space-y-2">
          {data && data.length === 0 && <EmptyState>Keine Nutzer.</EmptyState>}
          {data?.map((u) => {
            const isSelf = me?.id === u.id;
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-800">
                    {u.name}
                    {isSelf && <span className="ml-1 text-xs text-slate-500">(du)</span>}
                    {u.role === 'admin' && <Badge className="ml-2 bg-violet-100 text-violet-700">Admin</Badge>}
                  </div>
                  <div className="truncate text-xs text-slate-500">{u.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={u.role}
                    onChange={(e) => setRole(u, e.target.value)}
                    className="w-28"
                    disabled={isSelf}
                    aria-label={`Rolle von ${u.name}`}
                  >
                    <option value="user">Nutzer</option>
                    <option value="admin">Admin</option>
                  </Select>
                  <Button variant="ghost" onClick={() => setPwFor(u)}>
                    Passwort
                  </Button>
                  <Button variant="danger" onClick={() => del(u)} disabled={isSelf}>
                    Löschen
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Hinweis: Sich selbst kann man nicht löschen oder degradieren; der letzte Admin bleibt erhalten.
          Rollenänderungen greifen für betroffene Nutzer beim nächsten Login vollständig.
        </p>
      </Card>

      {adding && (
        <AddUserModal
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
      {pwFor && <PasswordModal user={pwFor} onClose={() => setPwFor(null)} />}
    </div>
  );
}
