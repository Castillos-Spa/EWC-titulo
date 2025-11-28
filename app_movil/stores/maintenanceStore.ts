import { create } from 'zustand';
import { OrdenTrabajoApi, type OrdenTrabajoDto } from '../services/OrdenTrabajoApi';

interface MaintenanceState {
  items: OrdenTrabajoDto[];
  current: OrdenTrabajoDto | null;
  loading: boolean;
  error: string | null;
  loadAll: () => Promise<void>;
  create: (data: { vehiculoId: number; tipo: string }) => Promise<void>;
  setCurrent: (ot: OrdenTrabajoDto | null) => void;
  update: (id: number, patch: Partial<Pick<OrdenTrabajoDto, 'estado' | 'responsableId' | 'tareas'>>) => Promise<void>;
  planificar: (id: number, tareas: string[]) => Promise<void>;
  asignar: (id: number, responsableId: number) => Promise<void>;
  cerrar: (id: number, checklist: string, resultado: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  items: [],
  current: null,
  loading: false,
  error: null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const items = await OrdenTrabajoApi.list();
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e?.message || 'Error al cargar mantenimiento', loading: false });
    }
  },

  create: async (data) => {
    set({ error: null });
    const created = await OrdenTrabajoApi.create({ vehiculoId: data.vehiculoId, tipo: data.tipo });
    set(state => ({ items: [created, ...state.items] }));
  },

  setCurrent: (ot) => set({ current: ot }),

  update: async (id, patch) => {
    const updated = await OrdenTrabajoApi.update(id, patch);
    set(state => ({ items: state.items.map(i => (i.id === id ? updated : i)), current: state.current?.id === id ? updated : state.current }));
  },

  planificar: async (id, tareas) => {
    const updated = await OrdenTrabajoApi.planificarTareas(id, tareas);
    set(state => ({ items: state.items.map(i => (i.id === id ? updated : i)), current: state.current?.id === id ? updated : state.current }));
  },

  asignar: async (id, responsableId) => {
    const updated = await OrdenTrabajoApi.asignarResponsable(id, responsableId);
    set(state => ({ items: state.items.map(i => (i.id === id ? updated : i)), current: state.current?.id === id ? updated : state.current }));
  },

  cerrar: async (id, checklist, resultado) => {
    await OrdenTrabajoApi.cerrar(id, checklist, resultado);
    await get().update(id, { estado: 'Cerrada' });
  },

  remove: async (id) => {
    await OrdenTrabajoApi.remove(id);
    set(state => ({ items: state.items.filter(i => i.id !== id), current: state.current?.id === id ? null : state.current }));
  },
}));
