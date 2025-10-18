import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Aseo } from '../../../types/Aseo';
import { fetchAseos, createAseo, updateAseo, deleteAseo } from '../../../utils/aseoApi';

type Ctx = {
  items: Aseo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: Partial<Aseo>) => Promise<Aseo>;
  update: (id: string, payload: Partial<Aseo>) => Promise<Aseo>;
  remove: (id: string) => Promise<void>;
};

const CleaningContext = createContext<Ctx | undefined>(undefined);

export const CleaningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Aseo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchAseos();
      setItems(list);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los reportes de limpieza');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (payload: Partial<Aseo>) => {
    const created = await createAseo(payload);
    setItems(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, payload: Partial<Aseo>) => {
    const updated = await updateAseo(id, payload);
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteAseo(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const value = useMemo<Ctx>(() => ({ items, loading, error, refresh, create, update, remove }), [items, loading, error, refresh, create, update, remove]);

  return <CleaningContext.Provider value={value}>{children}</CleaningContext.Provider>;
};

export default CleaningContext;