import { create } from 'zustand';
import { VehiculoApi, VehiculoDto, VehiculoEstado, VehiculoListResponse } from '../services/VehiculoApi';

export interface FleetState {
  vehicles: VehiculoDto[];
  currentVehicle: VehiculoDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  documentsByVehicle?: Record<number, { tipo: string; url: string; descripcion?: string; fechaSubida?: string }[]>;

  loadVehicles: () => Promise<void>;
  createVehicle: (data: { patente: string; capacidad: number; odometro: number; estado?: VehiculoEstado; marca?: string; modelo?: string; areaAsignada?: string; conductorId?: number; lastMaintenanceDate?: string }) => Promise<void>;
  updateVehicle: (id: number, patch: Partial<{ patente: string; capacidad: number; odometro: number; estado: VehiculoEstado; marca?: string; modelo?: string; areaAsignada?: string; conductorId?: number; lastMaintenanceDate?: string }>) => Promise<void>;
  deleteVehicle: (id: number) => Promise<void>;
  uploadDocument: (id: number, data: { tipo: string; url: string; descripcion?: string }) => Promise<void>;
  setCurrentVehicle: (v: VehiculoDto | null) => void;
  clearError: () => void;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  vehicles: [],
  currentVehicle: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  documentsByVehicle: {},

  loadVehicles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await VehiculoApi.getVehiculos();
      const list = Array.isArray(response) ? response : (response as VehiculoListResponse)?.items ?? [];
      set({ vehicles: list, isLoading: false });
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      set({ error: 'Error al cargar vehículos', isLoading: false });
    }
  },

  createVehicle: async (data) => {
    set({ isSubmitting: true, error: null });
    try {
      const created = await VehiculoApi.createVehiculo({
        patente: data.patente,
        capacidad: data.capacidad,
        odometro: data.odometro,
        estado: data.estado ?? 'disponible',
        // El backend espera marca/modelo (DTO); por defecto enviamos cadenas vacías si no vienen
        marca: data.marca ?? '',
        modelo: data.modelo ?? '',
        areaAsignada: data.areaAsignada,
        conductorId: data.conductorId,
        lastMaintenanceDate: data.lastMaintenanceDate,
      });
      set(state => ({ vehicles: [created, ...state.vehicles], isSubmitting: false }));
    } catch (error) {
      console.error('Error al crear vehículo:', error);
      set({ error: 'Error al crear vehículo', isSubmitting: false });
    }
  },

  updateVehicle: async (id, patch) => {
    try {
      const updated = await VehiculoApi.updateVehiculo(id, patch);
      set(state => ({ vehicles: state.vehicles.map(v => (v.id === id ? updated : v)) }));
    } catch (error) {
      console.error('Error al actualizar vehículo:', error);
      set({ error: 'Error al actualizar vehículo' });
    }
  },

  deleteVehicle: async (id) => {
    try {
      await VehiculoApi.deleteVehiculo(id);
      set(state => ({ vehicles: state.vehicles.filter(v => v.id !== id), currentVehicle: state.currentVehicle?.id === id ? null : state.currentVehicle }));
    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      set({ error: 'Error al eliminar vehículo' });
    }
  },

  uploadDocument: async (id, data) => {
    try {
      await VehiculoApi.registrarDocumento(id, data);
      // Guardar localmente para mostrar en UI
      const docs = get().documentsByVehicle ?? {};
      const entry = { ...data, fechaSubida: new Date().toISOString() };
      const list = docs[id] ? [entry, ...docs[id]] : [entry];
      set({ documentsByVehicle: { ...docs, [id]: list } });
    } catch (error) {
      console.error('Error al registrar documento:', error);
      set({ error: 'Error al registrar documento' });
    }
  },

  setCurrentVehicle: (v) => set({ currentVehicle: v }),
  clearError: () => set({ error: null }),
}));
