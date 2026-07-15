import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, apiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import type { User } from '../types';
import { Spinner, Card, Button, Input, Select, Field, Badge, Modal, PageHeader, EmptyState, ErrorBox } from '../components/ui';
import { useT } from '../i18n/LanguageContext';

function AddUserModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const t = useT();

  async function submit() {
    if (!name.trim() || !email.trim() || password.length < 8) {
      setErr(t('Name, E-Mail und Passwort (mind. 8 Zeichen) erforderlich'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post('/users', { name: name.trim(), email: email.trim(), password, role });
      toast.success(t('Nutzer angelegt'));
      onDone();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t('Nutzer anlegen')} busy={busy}>
      <div className="space-y-3">
        <Field label={t('Name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label={t('E-Mail')}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t('Passwort (mind. 8 Zeichen)')}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label={t('Rolle')}>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">{t('Nutzer')}</option>
            <option value="admin">{t('Admin')}</option>
          </Select>
        </Field>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('Abbrechen')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('Anlegen')}
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
  const t = useT();

  async function submit() {
    if (password.length < 8) {
      setErr(t('Mindestens 8 Zeichen'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/users/${user.id}/password`, { password });
      toast.success(t('Passwort geändert'));
      onClose();
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t('Passwort: {name}', { name: user.name })} busy={busy}>
      <div className="space-y-3">
        <Field label={t('Neues Passwort (mind. 8 Zeichen)')}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </Field>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('Abbrechen')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('Speichern')}
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
  const t = useT();

  if (loading) return <Spinner />;

  async function setRole(u: User, role: string) {
    if (role === u.role) return;
    try {
      await api.patch(`/users/${u.id}`, { role });
      toast.success(t('Rolle geändert'));
      reload();
    } catch (e) {
      toast.error(apiError(e));
      reload();
    }
  }

  async function del(u: User) {
    if (!(await confirm({ message: t('Nutzer „{name}" wirklich löschen?', { name: u.name }), danger: true, confirmLabel: t('Löschen') }))) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success(t('Nutzer gelöscht'));
      reload();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Nutzer')}
        subtitle={t('Konten verwalten (nur für Admins)')}
        actions={
          <Button variant="secondary" onClick={() => setAdding(true)}>
            {t('+ Nutzer')}
          </Button>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}

      <Card>
        <div className="space-y-2">
          {data && data.length === 0 && <EmptyState>{t('Keine Nutzer.')}</EmptyState>}
          {data?.map((u) => {
            const isSelf = me?.id === u.id;
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {u.name}
                    {isSelf && <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">{t('(du)')}</span>}
                    {u.role === 'admin' && <Badge className="ml-2 bg-violet-100 text-violet-700">{t('Admin')}</Badge>}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={u.role}
                    onChange={(e) => setRole(u, e.target.value)}
                    className="w-28"
                    disabled={isSelf}
                    aria-label={t('Rolle von {name}', { name: u.name })}
                  >
                    <option value="user">{t('Nutzer')}</option>
                    <option value="admin">{t('Admin')}</option>
                  </Select>
                  <Button variant="ghost" onClick={() => setPwFor(u)}>
                    {t('Passwort')}
                  </Button>
                  <Button variant="danger" onClick={() => del(u)} disabled={isSelf}>
                    {t('Löschen')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {t('Hinweis: Sich selbst kann man nicht löschen oder degradieren; der letzte Admin bleibt erhalten. Rollenänderungen greifen für betroffene Nutzer beim nächsten Login vollständig.')}
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
