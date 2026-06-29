import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { AppConfig } from '../types';

interface DataState {
  config: AppConfig | null;
  enableHouseModule: boolean;
  ready: boolean;
}

const DataContext = createContext<DataState | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .get<AppConfig>('/config')
      .then((r) => setConfig(r.data))
      // Fail closed: bei Fehler Modul aus, bis Config geladen ist
      .catch(() => setConfig({ appName: 'allkauf Fertighaus-Helfer', enableHouseModule: false }))
      .finally(() => setReady(true));
  }, []);

  return (
    <DataContext.Provider
      value={{ config, enableHouseModule: ready ? (config?.enableHouseModule ?? false) : false, ready }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData muss innerhalb von DataProvider verwendet werden');
  return ctx;
}
