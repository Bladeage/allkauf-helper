import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';
import { Button, Input, Field, ErrorBox } from '../components/ui';

export default function Login() {
  const { login, completeMfa, sessionExpired } = useAuth();
  const [step, setStep] = useState<'password' | 'mfa'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await login(email.trim(), password, remember);
      if (r.mfaRequired) {
        setStep('mfa');
        setCode('');
      }
    } catch (e2) {
      setErr(apiError(e2, 'Login fehlgeschlagen'));
    } finally {
      setBusy(false);
    }
  }

  async function submitMfa(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await completeMfa(code.trim());
    } catch (e2) {
      setErr(apiError(e2, 'Code ungültig'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700">
        <div className="mb-6 text-center">
          <div className="text-4xl">🏠</div>
          <h1 className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">Fertighaus-Helfer</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {step === 'password' ? 'Bitte anmelden' : 'Zwei-Faktor-Bestätigung'}
          </p>
        </div>

        {step === 'password' ? (
          <form onSubmit={submitPassword} className="space-y-4">
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
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-700 dark:text-brand-300 focus:ring-brand"
              />
              Eingeloggt bleiben
            </label>
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
        ) : (
          <form onSubmit={submitMfa} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Gib den 6-stelligen Code aus deiner Authenticator-App ein — oder einen Recovery-Code.
            </p>
            <Field label="Code">
              <Input
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456 oder Recovery-Code"
                required
              />
            </Field>
            {err && <ErrorBox>{err}</ErrorBox>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Prüfen…' : 'Bestätigen'}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => {
                setStep('password');
                setErr(null);
                setPassword('');
              }}
            >
              Zurück
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
