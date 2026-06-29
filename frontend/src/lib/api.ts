import axios from 'axios';

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
    // 401 von Login (Falschpasswort) bzw. /auth/me (noch nicht eingeloggt) ist KEIN Session-Ablauf
    const isAuthProbe = url.endsWith('/auth/login') || url.endsWith('/auth/me');
    if (axios.isAxiosError(err) && err.response?.status === 401 && !isAuthProbe) {
      onUnauthorized?.();
    }
    return Promise.reject(err);
  },
);

export function apiError(err: unknown, fallback = 'Es ist ein Fehler aufgetreten'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string } | undefined)?.error || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
