import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getFleetFuelSummary, type VehicleWithFuelHistory } from '../../../utils/fuelApi';
import { useAuth } from '../../../contexts/AuthContext';

interface FuelState {
  items: VehicleWithFuelHistory[];
  loading: boolean;
  error: string | null;
  search: string;
  from: string;
  to: string;
}

interface FuelContextValue extends FuelState {
  refresh: () => Promise<void>;
  setSearch: (q: string) => void;
  setFrom: (d: string) => void;
  setTo: (d: string) => void;
}

const FuelContext = createContext<FuelContextValue | undefined>(undefined);

export function FuelProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth();
  const [state, setState] = useState<FuelState>({ items: [], loading: true, error: null, search: '', from: '', to: '' });

  const refresh = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const data = await getFleetFuelSummary();
      setState((s) => ({ ...s, items: data, error: null, loading: false }));
    } catch (e) {
      console.error(e);
      setState((s) => ({ ...s, error: 'No se pudo cargar el consumo de combustible.', loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh, user]);

  const setSearch = (q: string) => setState((s) => ({ ...s, search: q }));
  const setFrom = (d: string) => setState((s) => ({ ...s, from: d }));
  const setTo = (d: string) => setState((s) => ({ ...s, to: d }));

  const value = useMemo<FuelContextValue>(() => ({ ...state, refresh, setSearch, setFrom, setTo }), [state, refresh]);
  return <FuelContext.Provider value={value}>{children}</FuelContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFuelContext() {
  const ctx = useContext(FuelContext);
  if (!ctx) throw new Error('useFuelContext must be used within FuelProvider');
  return ctx;
}
