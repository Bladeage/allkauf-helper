import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ThemeProvider, FONTS, SIZES, type FontKey, type SizeKey } from './context/ThemeContext';
import { LanguageProvider, initialLang } from './i18n/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// FOUC vermeiden: Theme synchron aus localStorage anwenden, bevor React rendert
// (läuft im gebündelten 'self'-Script -> CSP-konform, kein Aufblitzen beim Laden).
try {
  const m = localStorage.getItem('alkauf_theme_mode') || 'system';
  const dark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  const f = localStorage.getItem('alkauf_theme_font') as FontKey | null;
  if (f && FONTS[f]) document.documentElement.style.setProperty('--app-font', FONTS[f].stack);
  const s = localStorage.getItem('alkauf_theme_size') as SizeKey | null;
  if (s && SIZES[s]) document.documentElement.style.fontSize = SIZES[s].px;
  document.documentElement.lang = initialLang();
} catch {
  /* localStorage nicht verfügbar */
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <ToastProvider>
              <ConfirmProvider>
                <App />
              </ConfirmProvider>
            </ToastProvider>
          </DataProvider>
        </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
