import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { AppConfig } from '../types';

interface DataState {
  config: AppConfig | null;
  enableHouseModule: boolean;
}

const DataContext = createContext<DataState | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    api
      .get<AppConfig>('/config')
      .then((r) => setConfig(r.data))
      .catch(() => setConfig({ appName: 'allkauf Fertighaus-Helfer', enableHouseModule: true }));
  }, []);

  return (
    <DataContext.Provider value={{ config, enableHouseModule: config?.enableHouseModule ?? true }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData muss innerhalb von DataProvider verwendet werden');
  return ctx;
}
