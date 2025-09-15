import { create } from 'zustand';
import { DatabaseService } from '../services/DatabaseService';

export interface FuelRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  type: 'consumption' | 'refuel';
  amount: number; // Litros
  odometer: number; // Kilometraje
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  stationName?: string; // Para reabastecimientos
  receiptPhoto?: string; // Foto del recibo
  notes?: string;
  recordedAt: string;
  routeId?: string;
  tripId?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface FuelAnalytics {
  totalConsumption: number;
  totalRefueled: number;
  averageConsumption: number; // L/100km
  efficiency: 'excellent' | 'good' | 'average' | 'poor';
  lastRefuel?: FuelRecord;
  nextRefuelEstimate?: number; // km restantes
}

interface FuelState {
  records: FuelRecord[];
  analytics: FuelAnalytics | null;
  currentRecord: FuelRecord | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  loadFuelRecords: (vehicleId?: string, dateRange?: { start: string; end: string }) => Promise<void>;
  createFuelRecord: (recordData: Omit<FuelRecord, 'id' | 'recordedAt' | 'syncStatus'>) => Promise<void>;
  updateFuelRecord: (recordId: string, updates: Partial<FuelRecord>) => Promise<void>;
  deleteFuelRecord: (recordId: string) => Promise<void>;
  calculateAnalytics: (vehicleId: string) => Promise<void>;
  setCurrentRecord: (record: FuelRecord | null) => void;
  clearError: () => void;
}

export const useFuelStore = create<FuelState>((set, get) => ({
  records: [],
  analytics: null,
  currentRecord: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadFuelRecords: async (vehicleId?: string, dateRange?: { start: string; end: string }) => {
    set({ isLoading: true, error: null });
    try {
      const records = await DatabaseService.getFuelRecords(vehicleId, dateRange);
      set({ records, isLoading: false });
      
      // Calculate analytics if vehicleId is provided
      if (vehicleId) {
        await get().calculateAnalytics(vehicleId);
      }
    } catch (error) {
      set({ error: 'Error al cargar registros de combustible', isLoading: false });
    }
  },

  createFuelRecord: async (recordData) => {
    set({ isSubmitting: true, error: null });
    try {
      const newRecord: FuelRecord = {
        ...recordData,
        id: `fuel-${Date.now()}`,
        recordedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      try {
        await DatabaseService.saveFuelRecord(newRecord);
      } catch (dbError) {
        console.warn('Database save failed, continuing with local state:', dbError);
      }
      
      set(state => ({
        records: [newRecord, ...state.records],
        isSubmitting: false,
      }));

      // Recalculate analytics
      if (recordData.vehicleId) {
        await get().calculateAnalytics(recordData.vehicleId);
      }
    } catch (error) {
      set({ error: 'Error al crear registro de combustible', isSubmitting: false });
    }
  },

  updateFuelRecord: async (recordId: string, updates: Partial<FuelRecord>) => {
    try {
      const updatedRecord = { ...updates, syncStatus: 'pending' as const };
      await DatabaseService.updateFuelRecord(recordId, updatedRecord);
      
      set(state => ({
        records: state.records.map(record =>
          record.id === recordId ? { ...record, ...updatedRecord } : record
        ),
      }));
    } catch (error) {
      set({ error: 'Error al actualizar registro' });
    }
  },

  deleteFuelRecord: async (recordId: string) => {
    try {
      await DatabaseService.deleteFuelRecord(recordId);
      
      set(state => ({
        records: state.records.filter(record => record.id !== recordId),
      }));
    } catch (error) {
      set({ error: 'Error al eliminar registro' });
    }
  },

  calculateAnalytics: async (vehicleId: string) => {
    try {
      const records = get().records.filter(r => r.vehicleId === vehicleId);
      
      if (records.length === 0) {
        set({ analytics: null });
        return;
      }

      const consumptionRecords = records.filter(r => r.type === 'consumption');
      const refuelRecords = records.filter(r => r.type === 'refuel');

      const totalConsumption = consumptionRecords.reduce((sum, r) => sum + r.amount, 0);
      const totalRefueled = refuelRecords.reduce((sum, r) => sum + r.amount, 0);

      // Calculate average consumption (L/100km)
      let averageConsumption = 0;
      if (consumptionRecords.length >= 2) {
        const sortedRecords = consumptionRecords.sort((a, b) => 
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );
        
        const totalDistance = sortedRecords[sortedRecords.length - 1].odometer - sortedRecords[0].odometer;
        if (totalDistance > 0) {
          averageConsumption = (totalConsumption / totalDistance) * 100;
        }
      }

      // Determine efficiency rating
      let efficiency: FuelAnalytics['efficiency'] = 'average';
      if (averageConsumption > 0) {
        if (averageConsumption <= 25) efficiency = 'excellent';
        else if (averageConsumption <= 30) efficiency = 'good';
        else if (averageConsumption <= 40) efficiency = 'average';
        else efficiency = 'poor';
      }

      const lastRefuel = refuelRecords.sort((a, b) => 
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      )[0];

      // Estimate next refuel (assuming 500L tank, 80% refuel threshold)
      let nextRefuelEstimate;
      if (lastRefuel && averageConsumption > 0) {
        const currentFuel = 500 * 0.8; // Assume 80% tank after refuel
        const remainingKm = (currentFuel / averageConsumption) * 100;
        nextRefuelEstimate = Math.max(0, remainingKm);
      }

      const analytics: FuelAnalytics = {
        totalConsumption,
        totalRefueled,
        averageConsumption,
        efficiency,
        lastRefuel,
        nextRefuelEstimate,
      };

      set({ analytics });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  },

  setCurrentRecord: (record: FuelRecord | null) => {
    set({ currentRecord: record });
  },

  clearError: () => {
    set({ error: null });
  },
}));