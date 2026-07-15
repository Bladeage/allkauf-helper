import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { EN } from './en';

export type Lang = 'de' | 'en';
export const LANG_LS_KEY = 'alkauf_lang';

export function initialLang(): Lang {
  try {
    const s = localStorage.getItem(LANG_LS_KEY);
    if (s === 'de' || s === 'en') return s;
    return (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
  } catch {
    return 'de';
  }
}

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

// t(de, vars?) — deutscher Text ist der Schlüssel. In 'en' wird EN[de] genutzt (sonst Fallback de).
export type TFunc = (de: string, vars?: Record<string, string | number>) => string;

interface LangApi {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunc;
}

const Ctx = createContext<LangApi | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_LS_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
  }, []);

  const t = useCallback<TFunc>(
    (de, vars) => interpolate(lang === 'en' ? EN[de] ?? de : de, vars),
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang(): LangApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang muss innerhalb von LanguageProvider verwendet werden');
  return ctx;
}

// Bequemer Hook, wenn nur t() gebraucht wird.
export function useT(): TFunc {
  return useLang().t;
}

// Statische Übersetzung ohne Hook/Context (z. B. für Class-Components wie ErrorBoundary).
// Liest die Sprache direkt aus localStorage; reagiert nicht live auf Umschalten.
export function tStatic(de: string): string {
  try {
    return localStorage.getItem(LANG_LS_KEY) === 'en' ? EN[de] ?? de : de;
  } catch {
    return de;
  }
}
