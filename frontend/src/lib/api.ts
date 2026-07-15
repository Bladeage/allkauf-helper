import axios from 'axios';
import { tStatic } from '../i18n/LanguageContext';

// withCredentials: sendet das httpOnly-Auth-Cookie automatisch mit (same-origin)
export const api = axios.create({ baseURL: '/api', withCredentials: true });

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = (err.config && err.config.url) || '';
    // 401 aus dem Anmelde-/Onboarding-Flow ist KEIN Session-Ablauf (Falschpasswort/-code,
    // noch nicht eingeloggt) und darf den Nutzer nicht ausloggen.
    // Hinweis: /auth/login deckt auch /auth/login/2fa ab; /auth/2fa/disable liefert bei
    // falschem Passwort bewusst 403 (nicht 401), damit es hier nicht als Ablauf gilt.
    const isAuthProbe =
      url.includes('/auth/login') ||
      url.endsWith('/auth/me') ||
      url.endsWith('/auth/status') ||
      url.endsWith('/auth/setup');
    if (axios.isAxiosError(err) && err.response?.status === 401 && !isAuthProbe) {
      onUnauthorized?.();
    }
    return Promise.reject(err);
  },
);

export function apiError(err: unknown, fallback = 'Es ist ein Fehler aufgetreten'): string {
  let msg: string;
  if (axios.isAxiosError(err)) {
    msg = (err.response?.data as { error?: string } | undefined)?.error || err.message || fallback;
  } else if (err instanceof Error) {
    msg = err.message;
  } else {
    msg = fallback;
  }
  // Backend-Meldungen sind deutsch — im EN-Modus über das Wörterbuch übersetzen (sonst unverändert).
  return tStatic(msg);
}
