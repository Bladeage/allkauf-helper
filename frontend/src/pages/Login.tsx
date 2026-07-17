import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, apiError } from '../lib/api';
import { Button, Input, Field, ErrorBox } from '../components/ui';
import { useT } from '../i18n/LanguageContext';

export default function Login() {
  const t = useT();
  const { login, completeMfa, sessionExpired } = useAuth();
  const [step, setStep] = useState<'password' | 'mfa'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oidc, setOidc] = useState<{ enabled: boolean; label: string; showPasswordLogin: boolean }>({
    enabled: false,
    label: 'Einloggen mit OpenID',
    showPasswordLogin: true,
  });
  // Break-Glass: ?local=1 erzwingt das Passwort-Login auch im OpenID-only-Modus.
  const forceLocal = new URLSearchParams(window.location.search).has('local');
  const showPasswordForm = !oidc.enabled || oidc.showPasswordLogin || forceLocal;

  useEffect(() => {
    api
      .get<{ enabled: boolean; label: string; showPasswordLogin: boolean }>('/auth/oidc/config')
      .then((r) => setOidc(r.data))
      .catch(() => {});
    // Fehlerrückmeldung vom OIDC-Callback (?login_error=...) anzeigen und aus der URL putzen.
    if (new URLSearchParams(window.location.search).has('login_error')) {
      setErr(t('Anmeldung über Authentik fehlgeschlagen. Bitte erneut versuchen oder mit Passwort anmelden.'));
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setErr(apiError(e2, t('Login fehlgeschlagen')));
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
      setErr(apiError(e2, t('Code ungültig')));
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
            {step === 'password' ? t('Bitte anmelden') : t('Zwei-Faktor-Bestätigung')}
          </p>
        </div>

        {step === 'password' && sessionExpired && !err && (
          <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
            {t('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.')}
          </div>
        )}
        {err && (
          <div className="mb-4">
            <ErrorBox>{err}</ErrorBox>
          </div>
        )}

        {step === 'password' && oidc.enabled && (
          <div className={showPasswordForm ? 'mb-5 space-y-3' : 'space-y-3'}>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                window.location.href = '/api/auth/oidc/login';
              }}
            >
              🔐 {oidc.label}
            </Button>
            {showPasswordForm && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                {t('oder mit Passwort')}
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
            )}
          </div>
        )}

        {step === 'mfa' ? (
          <form onSubmit={submitMfa} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('Gib den 6-stelligen Code aus deiner Authenticator-App ein — oder einen Recovery-Code.')}
            </p>
            <Field label={t('Code')}>
              <Input
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('123456 oder Recovery-Code')}
                required
              />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t('Prüfen…') : t('Bestätigen')}
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
              {t('Zurück')}
            </button>
          </form>
        ) : showPasswordForm ? (
          <form onSubmit={submitPassword} className="space-y-4">
            <Field label={t('E-Mail')}>
              <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label={t('Passwort')}>
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
              {t('Eingeloggt bleiben')}
            </label>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t('Anmelden…') : t('Anmelden')}
            </Button>
          </form>
        ) : (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t('Anmeldung nur über OpenID.')}{' '}
            <a href="?local=1" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-200">
              {t('Stattdessen mit Passwort anmelden')}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
