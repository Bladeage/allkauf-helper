import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler } from '../lib/api';
import { getToken, setToken, clearToken } from '../lib/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
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
      } catch {
        clearToken();
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(r.data.token);
    setUser(r.data.user);
    navigate('/');
  };

  const logout = () => {
    clearToken();
    setUser(null);
    // gecachte API-Antworten des SW verwerfen, damit kein Vor-Nutzer-Datenrest bleibt
    if ('caches' in window) caches.delete('api-cache').catch(() => {});
    navigate('/');
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return ctx;
}
