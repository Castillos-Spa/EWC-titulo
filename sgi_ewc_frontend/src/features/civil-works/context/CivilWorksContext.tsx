import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { CivilWork, CivilWorkTask, CreateCivilWorkPayload } from '../../../types/CivilWork';
import { fetchCivilWorks, fetchCivilWorkById, createCivilWork, updateCivilWork, updateCivilWorkTasks, deleteCivilWork } from '../../../utils/civilWorkApi';

type Ctx = {
  items: Partial<CivilWork>[];
  selected: CivilWork | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectById: (id: number) => Promise<void>;
  clearSelection: () => void;
  create: (payload: CreateCivilWorkPayload) => Promise<CivilWork>;
  update: (id: number, payload: Partial<CivilWork>) => Promise<CivilWork>;
  updateTasks: (id: number, tasks: CivilWorkTask[]) => Promise<CivilWork>;
  remove: (id: number) => Promise<void>;
};

const CivilWorksContext = createContext<Ctx | undefined>(undefined);

export const CivilWorksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Partial<CivilWork>[]>([]);
  const [selected, setSelected] = useState<CivilWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchCivilWorks();
      setItems(res.items);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las obras civiles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const selectById = useCallback(async (id: number) => {
    const full = await fetchCivilWorkById(id);
    setSelected(full);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const create = useCallback(async (payload: CreateCivilWorkPayload) => {
    const created = await createCivilWork(payload);
    setItems(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: number, payload: Partial<CivilWork>) => {
    const updated = await updateCivilWork(id, payload);
    setItems(prev => prev.map(i => (i?.id === id ? { ...i, ...updated } : i)));
    if (selected?.id === id) setSelected(updated);
    return updated;
  }, [selected]);

  const updateTasks = useCallback(async (id: number, tasks: CivilWorkTask[]) => {
    const updated = await updateCivilWorkTasks(id, tasks);
    setItems(prev => prev.map(i => (i?.id === id ? { ...i, ...updated } : i)));
    if (selected?.id === id) setSelected(updated);
    return updated;
  }, [selected]);

  const remove = useCallback(async (id: number) => {
    await deleteCivilWork(id);
    setItems(prev => prev.filter(i => i?.id !== id));
    if (selected?.id === id) setSelected(null);
  }, [selected]);

  const value = useMemo<Ctx>(
    () => ({ items, selected, loading, error, refresh, selectById, clearSelection, create, update, updateTasks, remove }),
    [items, selected, loading, error, refresh, selectById, clearSelection, create, update, updateTasks, remove],
  );

  return <CivilWorksContext.Provider value={value}>{children}</CivilWorksContext.Provider>;
};

export default CivilWorksContext;
