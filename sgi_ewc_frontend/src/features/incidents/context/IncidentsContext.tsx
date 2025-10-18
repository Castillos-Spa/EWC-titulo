import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Incident } from '../../../types/Incident';
import { fetchIncidents, createIncident, updateIncident, deleteIncident } from '../../../utils/incidentApi';

type Ctx = {
  items: Incident[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (data: Partial<Incident>) => Promise<Incident>;
  update: (id: string, patch: Partial<Incident>) => Promise<Incident>;
  remove: (id: string) => Promise<void>;
};

const IncidentsContext = createContext<Ctx | undefined>(undefined);

export const IncidentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchIncidents();
      setItems(data);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los incidentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (data: Partial<Incident>) => {
    const created = await createIncident(data);
    setItems(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Incident>) => {
    const updated = await updateIncident(id, patch);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteIncident(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const value = useMemo<Ctx>(() => ({ items, loading, error, refresh, create, update, remove }), [items, loading, error, refresh, create, update, remove]);
  return <IncidentsContext.Provider value={value}>{children}</IncidentsContext.Provider>;
};

export default IncidentsContext;