import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler } from '../lib/api';
import { AUTH_FLAG, markLoggedIn, markLoggedOut } from '../lib/auth';
import { useT } from '../i18n/LanguageContext';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  ready: boolean;
  sessionExpired: boolean;
  needsSetup: boolean;
  // login: gibt zurück, ob noch ein 2FA-Code fehlt (mfaRequired).
  login: (email: string, password: string, remember?: boolean) => Promise<{ mfaRequired: boolean }>;
  completeMfa: (code: string) => Promise<void>;
  setup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function clearApiCache() {
  if ('caches' in window) caches.delete('api-cache').catch(() => {});
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const mfaToken = useRef<string | null>(null);
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    // 401 auf geschützte Endpunkte (Token abgelaufen) -> ausloggen + Hinweis
    setUnauthorizedHandler(() => {
      setUser((prev) => {
        if (prev) setSessionExpired(true);
        return null;
      });
      markLoggedOut();
      clearApiCache();
    });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      // Cookie wird automatisch mitgesendet; 200 = eingeloggt, 401 = nicht eingeloggt.
      // Parallel prüfen, ob überhaupt schon ein Admin existiert (Onboarding nötig?).
      const [meRes, statusRes] = await Promise.allSettled([
        api.get<User>('/auth/me'),
        api.get<{ needsSetup: boolean }>('/auth/status'),
      ]);
      if (!active) return;
      if (meRes.status === 'fulfilled') setUser(meRes.value.data);
      if (statusRes.status === 'fulfilled') setNeedsSetup(Boolean(statusRes.value.data.needsSetup));
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Multi-Tab-Sync über den (nicht-sensiblen) Auth-Flag
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== AUTH_FLAG) return;
      if (!e.newValue) setUser(null);
      else if (!user) window.location.reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  const login = async (email: string, password: string, remember = false) => {
    const r = await api.post<{ mfaRequired?: boolean; mfaToken?: string; user?: User }>('/auth/login', {
      email,
      password,
      remember,
    });
    if (r.data.mfaRequired && r.data.mfaToken) {
      mfaToken.current = r.data.mfaToken;
      return { mfaRequired: true };
    }
    setUser(r.data.user ?? null);
    setSessionExpired(false);
    markLoggedIn();
    return { mfaRequired: false };
  };

  const completeMfa = async (code: string) => {
    if (!mfaToken.current) throw new Error(t('Keine offene Zwei-Faktor-Anmeldung. Bitte erneut anmelden.'));
    const r = await api.post<{ user: User }>('/auth/login/2fa', { mfaToken: mfaToken.current, code });
    mfaToken.current = null;
    setUser(r.data.user);
    setSessionExpired(false);
    markLoggedIn();
  };

  const setup = async (name: string, email: string, password: string) => {
    const r = await api.post<{ user: User }>('/auth/setup', { name, email, password });
    setNeedsSetup(false);
    setUser(r.data.user);
    setSessionExpired(false);
    markLoggedIn();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* Cookie wird serverseitig gelöscht; Fehler ignorieren */
    }
    mfaToken.current = null;
    setUser(null);
    setSessionExpired(false);
    markLoggedOut();
    clearApiCache();
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, sessionExpired, needsSetup, login, completeMfa, setup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return ctx;
}
