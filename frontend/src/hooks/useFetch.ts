import { useCallback, useEffect, useRef, useState } from 'react';
import { api, apiError } from '../lib/api';

export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const reload = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }
    const my = ++reqId.current; // nur die jüngste Anfrage darf den State setzen (latest-wins)
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<T>(url);
      if (my === reqId.current) setData(r.data);
    } catch (e) {
      if (my === reqId.current) setError(apiError(e));
    } finally {
      if (my === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload, setData };
}
