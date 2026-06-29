import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler } from '../lib/api';
import { AUTH_FLAG, markLoggedIn, markLoggedOut } from '../lib/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  ready: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
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
  const navigate = useNavigate();

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
      try {
        // Cookie wird automatisch mitgesendet; 200 = eingeloggt, 401 = nicht eingeloggt
        const r = await api.get<User>('/auth/me');
        if (active) setUser(r.data);
      } catch {
        // nicht eingeloggt oder offline -> kein User (nichts zu löschen, Cookie ist httpOnly)
      } finally {
        if (active) setReady(true);
      }
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
    const r = await api.post<{ user: User }>('/auth/login', { email, password, remember });
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
    setUser(null);
    setSessionExpired(false);
    markLoggedOut();
    clearApiCache();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, ready, sessionExpired, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return ctx;
}
