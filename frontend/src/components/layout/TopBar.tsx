import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function TopBar({ open, onMenu }: { open: boolean; onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 safe-top">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden"
        aria-label="Menü öffnen"
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>
      <div className="font-semibold text-slate-700 dark:text-slate-200 md:hidden">🏠 Haus-Helfer</div>
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => setMode(isDark ? 'light' : 'dark')}
          className="rounded-lg p-2 text-base leading-none text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label={isDark ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'}
          title={isDark ? 'Helles Design' : 'Dunkles Design'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">{user?.name}</span>
        <button
          onClick={logout}
          className="rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          Abmelden
        </button>
      </div>
    </header>
  );
}
