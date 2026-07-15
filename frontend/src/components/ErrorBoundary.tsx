import { Component, type ReactNode } from 'react';
import { tStatic } from '../i18n/LanguageContext';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-full place-items-center p-6 text-center">
          <div>
            <div className="text-3xl">⚠️</div>
            <h1 className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">{tStatic('Etwas ist schiefgelaufen')}</h1>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              {tStatic('Neu laden')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
