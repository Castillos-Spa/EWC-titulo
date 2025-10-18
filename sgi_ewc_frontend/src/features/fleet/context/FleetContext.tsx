import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createVehiculoFromTaller, getVehiculosFromTaller, updateVehiculoFromTaller, type CreateVehiculoPayload } from '../../../utils/tallerApi';
import type { Vehiculo } from '../../../types/Vehiculo';

interface FleetState {
  items: Vehiculo[];
  loading: boolean;
  error: string | null;
  search: string;
  editing: Vehiculo | null;
  showForm: boolean;
}

interface FleetContextValue extends FleetState {
  refresh: () => Promise<void>;
  setSearch: (q: string) => void;
  openCreate: () => void;
  openEdit: (v: Vehiculo) => void;
  closeForm: () => void;
  create: (payload: CreateVehiculoPayload) => Promise<void>;
  update: (id: number, patch: Partial<CreateVehiculoPayload>) => Promise<void>;
}

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

export function FleetProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<FleetState>({ items: [], loading: true, error: null, search: '', editing: null, showForm: false });

  const refresh = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const data = await getVehiculosFromTaller();
      setState((s) => ({ ...s, items: data, error: null, loading: false }));
    } catch (e) {
      console.error(e);
      setState((s) => ({ ...s, error: 'Error al cargar los vehículos.', loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const setSearch = (q: string) => setState((s) => ({ ...s, search: q }));
  const openCreate = () => setState((s) => ({ ...s, showForm: true, editing: null }));
  const openEdit = (v: Vehiculo) => setState((s) => ({ ...s, showForm: true, editing: v }));
  const closeForm = () => setState((s) => ({ ...s, showForm: false, editing: null }));

  const create = useCallback(async (payload: CreateVehiculoPayload) => {
    const created = await createVehiculoFromTaller(payload);
    setState((s) => ({ ...s, items: [created, ...s.items], showForm: false, editing: null }));
  }, []);

  const update = useCallback(async (id: number, patch: Partial<CreateVehiculoPayload>) => {
    const updated = await updateVehiculoFromTaller(id, patch);
    setState((s) => ({ ...s, items: s.items.map(v => v.id === id ? updated : v), showForm: false, editing: null }));
  }, []);

  const value = useMemo<FleetContextValue>(() => ({
    ...state,
    refresh,
    setSearch,
    openCreate,
    openEdit,
    closeForm,
    create,
    update,
  }), [state, refresh, create, update]);

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFleetContext() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleetContext must be used within FleetProvider');
  return ctx;
}
