import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';
import { Button, Input, Field, ErrorBox } from '../components/ui';

export default function Login() {
  const { login, sessionExpired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await login(email.trim(), password);
    } catch (e2) {
      setErr(apiError(e2, 'Login fehlgeschlagen'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <div className="text-4xl">🏠</div>
          <h1 className="mt-2 text-xl font-bold text-slate-800">allkauf Haus-Helfer</h1>
          <p className="text-sm text-slate-500">Bitte anmelden</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="E-Mail">
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Passwort">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {sessionExpired && !err && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
              Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.
            </div>
          )}
          {err && <ErrorBox>{err}</ErrorBox>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Anmelden…' : 'Anmelden'}
          </Button>
        </form>
      </div>
    </div>
  );
}
