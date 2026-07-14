import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const baseItems: NavItem[] = [
  { to: '/', label: 'Startseite', icon: '🏠', end: true },
  { to: '/timeline', label: 'Zeitleiste', icon: '📅' },
  { to: '/phases', label: 'Phasen', icon: '✅' },
  { to: '/costs', label: 'Kosten', icon: '💶' },
  { to: '/reminders', label: 'Wiedervorlagen', icon: '🔔' },
  { to: '/defects', label: 'Mängel', icon: '🔧' },
  { to: '/diary', label: 'Bautagebuch', icon: '📓' },
  { to: '/payments', label: 'Zahlungen', icon: '🧾' },
  { to: '/contacts', label: 'Kontakte', icon: '📇' },
];

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium';

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { enableHouseModule } = useData();
  const { user } = useAuth();
  const items: NavItem[] = [...baseItems];
  if (enableHouseModule) items.push({ to: '/house', label: 'Haus', icon: '🧱' });
  if (user?.role === 'admin') items.push({ to: '/users', label: 'Nutzer', icon: '👤' });
  items.push({ to: '/settings', label: 'Einstellungen', icon: '⚙️' });

  return (
    <div className="flex h-full flex-col safe-top">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="text-2xl">🏠</span>
        <div>
          <div className="font-bold leading-tight text-slate-800 dark:text-slate-100">Haus-Helfer</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Bau-Begleiter</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`
            }
          >
            <span className="text-lg">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 text-xs text-slate-300 dark:text-slate-600">v1.0 · self-hosted</div>
    </div>
  );
}
