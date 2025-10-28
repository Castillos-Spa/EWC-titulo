import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { StandardVehiculo, CreateStandardVehiculo } from '../../../../utils/mockStandardApi';
import { getStandardVehiculos, createStandardVehiculo, updateStandardVehiculo } from '../../../../utils/mockStandardApi';

type State = {
  items: StandardVehiculo[];
  loading: boolean;
  error: string | null;
  search: string;
  editing: StandardVehiculo | null;
  showForm: boolean;
};

type Ctx = State & {
  refresh: () => Promise<void>;
  setSearch: (q: string) => void;
  openCreate: () => void;
  openEdit: (v: StandardVehiculo) => void;
  closeForm: () => void;
  create: (payload: CreateStandardVehiculo) => Promise<void>;
  update: (id: number, patch: Partial<CreateStandardVehiculo>) => Promise<void>;
};

const C = createContext<Ctx | undefined>(undefined);

export const StandardFleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<State>({ items: [], loading: true, error: null, search: '', editing: null, showForm: false });

  const refresh = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true }));
      const data = await getStandardVehiculos();
      setState(s => ({ ...s, items: data, loading: false, error: null }));
    } catch (e) {
      console.error(e);
      setState(s => ({ ...s, loading: false, error: 'No se pudieron cargar los vehículos (mock).' }));
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const setSearch = (q: string) => setState(s => ({ ...s, search: q }));
  const openCreate = () => setState(s => ({ ...s, showForm: true, editing: null }));
  const openEdit = (v: StandardVehiculo) => setState(s => ({ ...s, showForm: true, editing: v }));
  const closeForm = () => setState(s => ({ ...s, showForm: false, editing: null }));

  const create = useCallback(async (payload: CreateStandardVehiculo) => {
    const created = await createStandardVehiculo(payload);
    setState(s => ({ ...s, items: [created, ...s.items], showForm: false, editing: null }));
  }, []);

  const update = useCallback(async (id: number, patch: Partial<CreateStandardVehiculo>) => {
    const updated = await updateStandardVehiculo(id, patch);
    setState(s => ({ ...s, items: s.items.map(v => v.id === id ? updated : v), showForm: false, editing: null }));
  }, []);

  const value = useMemo<Ctx>(() => ({
    ...state,
    refresh,
    setSearch,
    openCreate,
    openEdit,
    closeForm,
    create,
    update,
  }), [state, refresh, create, update]);

  return <C.Provider value={value}>{children}</C.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useStandardFleet() {
  const ctx = useContext(C);
  if (!ctx) throw new Error('useStandardFleet must be used within StandardFleetProvider');
  return ctx;
}
