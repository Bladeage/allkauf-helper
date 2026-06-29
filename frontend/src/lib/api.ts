import axios from 'axios';
import { getToken, clearToken } from './auth';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      clearToken();
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
