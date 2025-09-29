import type { FleetFuelSummary, FuelRecord } from '../types/Fuel';

export interface DateRange { from?: string; to?: string }

// Nota: Por ahora devolvemos datos mock; cuando el backend exponga endpoints, cambiaremos a apiFetch.

export async function getFleetFuelSummary(): Promise<FleetFuelSummary[]> {
  // MOCK: dos flotas con vehículos y métricas agregadas
  const fleets: FleetFuelSummary[] = [
    {
      fleetId: 'fleet-trans-1',
      fleetName: 'Transporte Urbano',
      manager: 'Supervisor A',
      vehicles: [
        {
          vehicleId: 'veh-001',
          vehiclePlate: 'ABC-123',
          analytics: {
            totalConsumption: 320,
            totalRefueled: 340,
            averageConsumption: 28.5,
            efficiency: 'good',
            lastRefuel: {
              id: 'fuel-1', vehicleId: 'veh-001', vehiclePlate: 'ABC-123', driverId: 'u1', driverName: 'Juan Pérez',
              type: 'refuel', amount: 80, odometer: 12500,
              location: { latitude: -34.6, longitude: -58.38, address: 'Est. YPF Centro' }, stationName: 'YPF Centro',
              recordedAt: new Date().toISOString(), syncStatus: 'synced'
            }
          }
        },
        {
          vehicleId: 'veh-002',
          vehiclePlate: 'DEF-456',
          analytics: {
            totalConsumption: 410,
            totalRefueled: 420,
            averageConsumption: 31.2,
            efficiency: 'average',
            lastRefuel: undefined,
          }
        }
      ],
      totalConsumption: 730,
      totalRefueled: 760,
      averageConsumption: 29.8,
      efficiency: 'good',
    },
    {
      fleetId: 'fleet-trans-2',
      fleetName: 'Flota Interurbana',
      manager: 'Supervisor B',
      vehicles: [
        {
          vehicleId: 'veh-010',
          vehiclePlate: 'JKL-789',
          analytics: {
            totalConsumption: 520,
            totalRefueled: 560,
            averageConsumption: 42.1,
            efficiency: 'poor',
          }
        }
      ],
      totalConsumption: 520,
      totalRefueled: 560,
      averageConsumption: 42.1,
      efficiency: 'poor',
    }
  ];
  return Promise.resolve(fleets);
}

export async function getFleetVehiclesFuelRecords(): Promise<Record<string, FuelRecord[]>> {
  // MOCK: devuelve registros por vehículoId
  return Promise.resolve({});
}
