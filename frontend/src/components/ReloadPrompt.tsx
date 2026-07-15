import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../i18n/LanguageContext';

// Zeigt bei neuer App-Version einen Hinweis statt still neu zu laden (kein Reload mitten in einer Eingabe)
export function ReloadPrompt() {
  const t = useT();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-slate-800 px-4 py-3 text-sm text-white safe-bottom"
    >
      <span>{t('Neue Version verfügbar.')}</span>
      <button onClick={() => updateServiceWorker(true)} className="rounded-lg bg-brand-700 px-3 py-1.5 font-medium hover:bg-brand-800">
        {t('Neu laden')}
      </button>
      <button onClick={() => setNeedRefresh(false)} className="rounded-lg px-3 py-1.5 text-slate-300 dark:text-slate-600 hover:text-white">
        {t('Später')}
      </button>
    </div>
  );
}
