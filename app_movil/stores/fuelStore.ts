import { create } from 'zustand';
import { FuelApi, type CreateFuelLogPayload, type FuelLogDto, type VehicleFuelSummary } from '@/services/FuelApi';

export type FuelEfficiencyBadge = 'excellent' | 'good' | 'watch' | 'critical' | 'unknown';

export interface FuelLogRecord extends FuelLogDto {
  vehicleId: number;
  vehiclePlate: string;
  vehicleMarca?: string | null;
  vehicleModelo?: string | null;
}

export interface FuelAnalyticsSnapshot {
  totalLiters: number;
  totalDistance: number;
  refuelCount: number;
  averageConsumption: number;
  efficiency: FuelEfficiencyBadge;
  lastRefuel?: FuelLogRecord;
}

interface FuelState {
  summary: VehicleFuelSummary[];
  vehicleRecords: FuelLogRecord[];
  analytics: FuelAnalyticsSnapshot | null;
  currentRecord: FuelLogRecord | null;
  isLoadingSummary: boolean;
  isLoadingRecords: boolean;
  isSubmitting: boolean;
  error: string | null;
  loadFleetSummary: () => Promise<void>;
  loadVehicleHistory: (vehiculoId: number) => Promise<void>;
  createFuelRecord: (payload: CreateFuelLogPayload) => Promise<void>;
  setCurrentRecord: (record: FuelLogRecord | null) => void;
  clearError: () => void;
}

const classifyEfficiency = (consumption: number): FuelEfficiencyBadge => {
  if (consumption <= 0 || !Number.isFinite(consumption)) return 'unknown';
  if (consumption < 20) return 'excellent';
  if (consumption < 30) return 'good';
  if (consumption < 40) return 'watch';
  return 'critical';
};

const buildAnalytics = (logs: FuelLogRecord[]): FuelAnalyticsSnapshot | null => {
  if (!logs.length) return null;
  const ordered = [...logs].sort((a, b) => a.odometer - b.odometer);
  let totalDistance = 0;
  let distanceLiters = 0;
  for (let index = 1; index < ordered.length; index++) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const distance = current.odometer - previous.odometer;
    if (distance > 0 && previous.liters > 0) {
      totalDistance += distance;
      distanceLiters += previous.liters;
    }
  }
  const refuelCount = ordered.length;
  const totalLiters = ordered.reduce((sum, log) => sum + (log.liters ?? 0), 0);
  const averageConsumption = totalDistance > 0 ? (distanceLiters / totalDistance) * 100 : 0;
  return {
    totalLiters,
    totalDistance,
    refuelCount,
    averageConsumption,
    efficiency: classifyEfficiency(averageConsumption),
    lastRefuel: ordered[ordered.length - 1],
  };
};

export const useFuelStore = create<FuelState>((set, get) => ({
  summary: [],
  vehicleRecords: [],
  analytics: null,
  currentRecord: null,
  isLoadingSummary: false,
  isLoadingRecords: false,
  isSubmitting: false,
  error: null,

  loadFleetSummary: async () => {
    set({ isLoadingSummary: true, error: null });
    try {
      const data = await FuelApi.getFleetSummary();
      set({ summary: data, isLoadingSummary: false });
    } catch (error) {
      console.error('Error al cargar resumen de combustible:', error);
      set({ error: 'No se pudo cargar el módulo de combustible.', isLoadingSummary: false });
    }
  },

  loadVehicleHistory: async (vehiculoId: number) => {
    if (!vehiculoId) {
      set({ vehicleRecords: [], analytics: null });
      return;
    }
    set({ isLoadingRecords: true, error: null });
    try {
      const vehicle = await FuelApi.getVehicleHistory(vehiculoId);
      const logs: FuelLogRecord[] = (vehicle?.fuelLogs ?? []).map((log) => ({
        ...log,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.patente,
        vehicleMarca: vehicle?.marca,
        vehicleModelo: vehicle?.modelo,
      }));
      set({ vehicleRecords: logs, analytics: buildAnalytics(logs), isLoadingRecords: false, currentRecord: null });
    } catch (error) {
      console.error('Error al cargar historial de combustible:', error);
      set({ error: 'No se pudo cargar el historial del vehículo.', isLoadingRecords: false });
    }
  },

  createFuelRecord: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      await FuelApi.createFuelLog(payload);
      await get().loadFleetSummary();
      if (payload.vehiculoId) {
        await get().loadVehicleHistory(payload.vehiculoId);
      }
    } catch (error) {
      console.error('Error al registrar carga de combustible:', error);
      set({ error: 'No se pudo registrar el combustible.' });
    } finally {
      set({ isSubmitting: false });
    }
  },

  setCurrentRecord: (record) => {
    set({ currentRecord: record });
  },

  clearError: () => {
    set({ error: null });
  },
}));