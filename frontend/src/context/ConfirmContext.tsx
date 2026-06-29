import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Button } from '../components/ui';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setState(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (v: boolean) => {
    setState(null);
    resolver.current?.(v);
    resolver.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <Modal open onClose={() => close(false)} title={state.title || 'Bestätigen'}>
          <p className="text-sm text-slate-600">{state.message}</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => close(false)}>
              Abbrechen
            </Button>
            <Button variant={state.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
              {state.confirmLabel || 'OK'}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm muss innerhalb von ConfirmProvider verwendet werden');
  return ctx;
}
