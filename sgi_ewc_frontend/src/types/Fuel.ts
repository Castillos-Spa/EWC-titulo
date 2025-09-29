export type FuelRecordType = 'consumption' | 'refuel';

export interface FuelRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  type: FuelRecordType;
  amount: number; // Litros
  odometer: number; // Km
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  stationName?: string;
  receiptPhoto?: string;
  notes?: string;
  recordedAt: string; // ISO
  routeId?: string;
  tripId?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export type FuelEfficiency = 'excellent' | 'good' | 'average' | 'poor';

export interface FuelAnalytics {
  totalConsumption: number;
  totalRefueled: number;
  averageConsumption: number; // L/100km
  efficiency: FuelEfficiency;
  lastRefuel?: FuelRecord;
  nextRefuelEstimate?: number; // km restantes
}

export interface VehicleFuelSummary {
  vehicleId: string;
  vehiclePlate: string;
  analytics: FuelAnalytics;
}

export interface FleetFuelSummary {
  fleetId: string;
  fleetName: string;
  manager?: string;
  vehicles: VehicleFuelSummary[];
  // agregados de flota
  totalConsumption: number;
  totalRefueled: number;
  averageConsumption: number; // promedio ponderado
  efficiency: FuelEfficiency;
}
