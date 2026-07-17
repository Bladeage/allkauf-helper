import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';
import { Card, Button, Badge, ErrorBox } from './ui';
import { useToast } from '../context/ToastContext';
import { useT } from '../i18n/LanguageContext';

type Status = { linked: boolean; hasPassword: boolean };

export default function OpenIdLinkCard() {
  const t = useT();
  const toast = useToast();
  const [oidcEnabled, setOidcEnabled] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadStatus() {
    try {
      const r = await api.get<Status>('/auth/oidc/status');
      setStatus(r.data);
    } catch {
      /* Status optional — bei Fehler Karte einfach neutral lassen */
    }
  }

  useEffect(() => {
    api
      .get<{ enabled: boolean }>('/auth/oidc/config')
      .then((r) => {
        setOidcEnabled(r.data.enabled);
        if (r.data.enabled) loadStatus();
      })
      .catch(() => setOidcEnabled(false));
  }, []);

  // Karte nur zeigen, wenn OIDC überhaupt aktiv ist.
  if (!oidcEnabled) return null;

  async function unlink() {
    if (status && !status.hasPassword) {
      const ok = window.confirm(
        t(
          'Achtung: Du hast kein lokales Passwort. Nach dem Aufheben kommst du nur über eine erneute OpenID-Anmeldung wieder hinein. Trotzdem aufheben?',
        ),
      );
      if (!ok) return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post<Status>('/auth/oidc/unlink');
      setStatus(r.data);
      toast.success(t('OpenID-Verknüpfung aufgehoben.'));
    } catch (e) {
      setErr(apiError(e, t('Aufheben fehlgeschlagen')));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t('OpenID-Verknüpfung')}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">{t('Status:')}</span>
          {status?.linked ? (
            <Badge className="bg-emerald-100 text-emerald-700">{t('verknüpft')}</Badge>
          ) : (
            <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              {t('nicht verknüpft')}
            </Badge>
          )}
        </div>

        {status?.linked ? (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                'Hebt die Verknüpfung deines Kontos mit deiner OpenID-Identität auf (Schutz vor Impersonation). Bei der nächsten OpenID-Anmeldung wird neu verknüpft.',
              )}
            </p>
            {err && <ErrorBox>{err}</ErrorBox>}
            <Button variant="danger" onClick={unlink} disabled={busy}>
              {busy ? t('Aufheben…') : t('Verknüpfung aufheben')}
            </Button>
          </>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('Melde dich einmal über OpenID an, um dein Konto zu verknüpfen.')}
          </p>
        )}
      </div>
    </Card>
  );
}
