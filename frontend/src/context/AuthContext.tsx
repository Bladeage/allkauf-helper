import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler } from '../lib/api';
import { getToken, setToken, clearToken, TOKEN_KEY } from '../lib/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  ready: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
    // 401 (abgelaufen/ungültig): ausloggen, SW-Cache leeren, Hinweis merken (nur wenn vorher eingeloggt)
    setUnauthorizedHandler(() => {
      setUser((prev) => {
        if (prev) setSessionExpired(true);
        return null;
      });
      clearApiCache();
    });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const r = await api.get<User>('/auth/me');
        if (active) setUser(r.data);
      } catch (e) {
        // Nur bei echtem 401 das Token verwerfen; bei 5xx/Offline-Start (PWA) Token behalten
        if (axios.isAxiosError(e) && e.response?.status === 401) clearToken();
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Multi-Tab-Sync: Logout/Login in einem anderen Tab übernehmen
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY) return;
      if (!e.newValue) setUser(null);
      else if (!user) window.location.reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  const login = async (email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(r.data.token);
    setUser(r.data.user);
    setSessionExpired(false);
    // Bewusst kein navigate('/') — die aktuelle URL (Deep-Link) wird nach Login einfach gerendert.
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setSessionExpired(false);
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
