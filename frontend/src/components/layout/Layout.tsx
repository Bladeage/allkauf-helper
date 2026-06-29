import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  const [open, setOpen] = useState(false);

  // Mobiler Nav-Drawer: Escape schließt, Body-Scroll sperren
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex h-full">
      {/* Desktop-Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        <Sidebar />
      </aside>

      {/* Mobile-Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar open={open} onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto safe-bottom">
          <div className="mx-auto max-w-5xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
