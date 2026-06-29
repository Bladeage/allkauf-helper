import { useAuth } from '../../context/AuthContext';

export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 safe-top">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="Menü öffnen"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>
      <div className="font-semibold text-slate-700 md:hidden">🏠 Haus-Helfer</div>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm text-slate-500 sm:inline">{user?.name}</span>
        <button
          onClick={logout}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
        >
          Abmelden
        </button>
      </div>
    </header>
  );
}
