import { useState, type FormEvent } from 'react';
import { api, apiError } from '../lib/api';
import { Card, Button, Input, Field, ErrorBox } from './ui';
import { useToast } from '../context/ToastContext';

export default function PasswordChangeCard() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (next.length < 8) {
      setErr('Das neue Passwort muss mindestens 8 Zeichen haben.');
      return;
    }
    if (next !== confirm) {
      setErr('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post('/auth/password', { currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Passwort geändert. Andere Sitzungen wurden abgemeldet.');
    } catch (e2) {
      setErr(apiError(e2, 'Änderung fehlgeschlagen'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Passwort ändern">
      <form onSubmit={submit} className="max-w-sm space-y-3">
        <Field label="Aktuelles Passwort">
          <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="Neues Passwort" hint="Mindestens 8 Zeichen">
          <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="Neues Passwort bestätigen">
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {err && <ErrorBox>{err}</ErrorBox>}
        <Button type="submit" disabled={busy || !current || !next}>
          {busy ? 'Ändern…' : 'Passwort ändern'}
        </Button>
      </form>
    </Card>
  );
}
