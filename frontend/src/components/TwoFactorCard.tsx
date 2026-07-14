import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';
import { Card, Button, Input, Field, ErrorBox, Badge, Spinner } from './ui';
import { useToast } from '../context/ToastContext';

type Status = { totpEnabled: boolean; recoveryRemaining: number };
type Enrollment = { secret: string; otpauth: string; qrDataUrl: string };

export default function TwoFactorCard() {
  const toast = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Aktivierungs-Flow
  const [enroll, setEnroll] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  // Deaktivierungs-Flow
  const [disabling, setDisabling] = useState(false);
  const [password, setPassword] = useState('');

  async function loadStatus() {
    try {
      const r = await api.get<Status>('/auth/2fa/status');
      setStatus(r.data);
    } catch (e) {
      setErr(apiError(e, 'Status konnte nicht geladen werden'));
    }
  }
  useEffect(() => {
    loadStatus();
  }, []);

  function resetFlows() {
    setEnroll(null);
    setCode('');
    setRecoveryCodes(null);
    setDisabling(false);
    setPassword('');
    setErr(null);
  }

  async function startEnroll() {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post<Enrollment>('/auth/2fa/setup');
      setEnroll(r.data);
    } catch (e) {
      setErr(apiError(e, 'Einrichtung konnte nicht gestartet werden'));
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post<{ recoveryCodes: string[] }>('/auth/2fa/enable', { code: code.trim() });
      setRecoveryCodes(r.data.recoveryCodes);
      setEnroll(null);
      setCode('');
      await loadStatus();
      toast.success('Zwei-Faktor-Authentisierung aktiviert.');
    } catch (e) {
      setErr(apiError(e, 'Code ungültig'));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    setBusy(true);
    setErr(null);
    try {
      await api.post('/auth/2fa/disable', { password });
      resetFlows();
      await loadStatus();
      toast.success('Zwei-Faktor-Authentisierung deaktiviert.');
    } catch (e) {
      setErr(apiError(e, 'Passwort falsch'));
    } finally {
      setBusy(false);
    }
  }

  function downloadRecovery() {
    if (!recoveryCodes) return;
    const blob = new Blob([recoveryCodes.join('\n') + '\n'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!status) {
    return (
      <Card title="Zwei-Faktor-Authentisierung">
        <Spinner />
      </Card>
    );
  }

  return (
    <Card title="Zwei-Faktor-Authentisierung">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Status:</span>
          {status.totpEnabled ? (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">aktiv</Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">inaktiv</Badge>
          )}
          {status.totpEnabled && (
            <span className="text-slate-500 dark:text-slate-400">· {status.recoveryRemaining} Recovery-Codes übrig</span>
          )}
        </div>

        {err && <ErrorBox>{err}</ErrorBox>}

        {/* Frisch erzeugte Recovery-Codes (nur EINMAL sichtbar) */}
        {recoveryCodes && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Bewahre diese Recovery-Codes sicher auf — sie werden nur jetzt angezeigt.
            </p>
            <ul className="my-2 grid grid-cols-2 gap-1 font-mono text-sm text-slate-800 dark:text-slate-100">
              {recoveryCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button onClick={downloadRecovery}>Herunterladen</Button>
              <Button variant="secondary" onClick={() => setRecoveryCodes(null)}>
                Ich habe sie gesichert
              </Button>
            </div>
          </div>
        )}

        {/* Aktivierung: QR + Code */}
        {enroll && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Scanne den QR-Code mit einer Authenticator-App (z. B. Google Authenticator, Aegis, 1Password) und gib dann
              den 6-stelligen Code ein.
            </p>
            <img src={enroll.qrDataUrl} alt="TOTP-QR-Code" className="h-44 w-44 rounded bg-white p-2" />
            <p className="break-all text-xs text-slate-500 dark:text-slate-400">
              Manuell: <span className="font-mono">{enroll.secret}</span>
            </p>
            <Field label="Code aus der App">
              <Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
            </Field>
            <div className="flex gap-2">
              <Button onClick={confirmEnroll} disabled={busy || code.trim().length < 6}>
                {busy ? 'Prüfen…' : 'Aktivieren'}
              </Button>
              <Button variant="secondary" onClick={resetFlows}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Deaktivierung: Passwort bestätigen */}
        {disabling && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Bestätige mit deinem Passwort, um 2FA zu deaktivieren.</p>
            <Field label="Passwort">
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button variant="danger" onClick={confirmDisable} disabled={busy || !password}>
                {busy ? 'Deaktivieren…' : '2FA deaktivieren'}
              </Button>
              <Button variant="secondary" onClick={resetFlows}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Aktionsbuttons (wenn kein Flow offen) */}
        {!enroll && !disabling && !recoveryCodes && (
          <div>
            {status.totpEnabled ? (
              <Button variant="danger" onClick={() => setDisabling(true)}>
                Deaktivieren
              </Button>
            ) : (
              <Button onClick={startEnroll} disabled={busy}>
                {busy ? 'Starte…' : '2FA aktivieren'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
