import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontKey = 'standard' | 'humanist' | 'serif' | 'mono';
export type SizeKey = 'sm' | 'md' | 'lg';

export const FONTS: Record<FontKey, { label: string; stack: string }> = {
  standard: { label: 'Standard', stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  humanist: { label: 'Humanist', stack: "'Segoe UI', Verdana, Geneva, Tahoma, sans-serif" },
  serif: { label: 'Serif', stack: "ui-serif, Georgia, Cambria, 'Times New Roman', serif" },
  mono: { label: 'Monospace', stack: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace" },
};

export const SIZES: Record<SizeKey, { label: string; px: string }> = {
  sm: { label: 'Klein', px: '15px' },
  md: { label: 'Normal', px: '16px' },
  lg: { label: 'Groß', px: '18px' },
};

interface ThemeState {
  mode: ThemeMode;
  font: FontKey;
  size: SizeKey;
  setMode: (m: ThemeMode) => void;
  setFont: (f: FontKey) => void;
  setSize: (s: SizeKey) => void;
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

const LS = { mode: 'alkauf_theme_mode', font: 'alkauf_theme_font', size: 'alkauf_theme_size' };

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => read(LS.mode, ['light', 'dark', 'system'] as const, 'system'));
  const [font, setFontState] = useState<FontKey>(() => read(LS.font, ['standard', 'humanist', 'serif', 'mono'] as const, 'standard'));
  const [size, setSizeState] = useState<SizeKey>(() => read(LS.size, ['sm', 'md', 'lg'] as const, 'md'));

  // Dunkelmodus anwenden (fix oder System-Präferenz folgend)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    if (mode === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [mode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font', FONTS[font].stack);
  }, [font]);

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[size].px;
  }, [size]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(LS.mode, m);
    } catch {
      /* localStorage nicht verfügbar */
    }
  };
  const setFont = (f: FontKey) => {
    setFontState(f);
    try {
      localStorage.setItem(LS.font, f);
    } catch {
      /* localStorage nicht verfügbar */
    }
  };
  const setSize = (s: SizeKey) => {
    setSizeState(s);
    try {
      localStorage.setItem(LS.size, s);
    } catch {
      /* localStorage nicht verfügbar */
    }
  };

  return <ThemeContext.Provider value={{ mode, font, size, setMode, setFont, setSize }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme muss innerhalb von ThemeProvider verwendet werden');
  return ctx;
}
