import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';
import { Button, Input, Field, ErrorBox } from '../components/ui';
import { useT } from '../i18n/LanguageContext';

export default function Onboarding() {
  const t = useT();
  const { setup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setErr(t('Das Passwort muss mindestens 8 Zeichen haben.'));
      return;
    }
    if (password !== confirm) {
      setErr(t('Die Passwörter stimmen nicht überein.'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await setup(name.trim(), email.trim(), password);
    } catch (e2) {
      setErr(apiError(e2, t('Einrichtung fehlgeschlagen')));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700">
        <div className="mb-6 text-center">
          <div className="text-4xl">🏠</div>
          <h1 className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">{t('Willkommen')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('Lege deinen Administrator-Account an, um loszulegen.')}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label={t('Name')}>
            <Input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={t('E-Mail')}>
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label={t('Passwort')} hint={t('Mindestens 8 Zeichen')}>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field label={t('Passwort bestätigen')}>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
          {err && <ErrorBox>{err}</ErrorBox>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? t('Wird angelegt…') : t('Account erstellen & starten')}
          </Button>
        </form>
      </div>
    </div>
  );
}
