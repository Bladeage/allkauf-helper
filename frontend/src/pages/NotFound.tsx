import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="grid place-items-center py-16 text-center">
      <div>
        <div className="text-5xl">🧭</div>
        <h1 className="mt-3 text-xl font-bold text-slate-800 dark:text-slate-100">Seite nicht gefunden</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Diese Adresse gibt es nicht.</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
