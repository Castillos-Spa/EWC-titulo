import type { RoutePlan, RouteStatus } from '../types/Route';

let ROUTES: RoutePlan[] = [
  {
    id: 'route-1',
    name: 'Warehouse A → Distribution Center B',
    origin: { latitude: -34.6, longitude: -58.38, address: 'Warehouse A' },
    destination: { latitude: -34.61, longitude: -58.39, address: 'Distribution Center B' },
    plannedDate: '2025-01-28',
    plannedStartTime: '08:00',
    plannedEndTime: '12:00',
    vehicleId: 'veh-001',
    vehiclePlate: 'TK-001',
    driverId: 'u1',
    driverName: 'John Driver',
    plannedVolumeLiters: 15000,
    status: 'scheduled',
    createdBy: 'planner',
    notes: 'Priority delivery',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'route-2',
    name: 'Center B → Client Site C',
    origin: { latitude: -34.62, longitude: -58.4, address: 'Center B' },
    destination: { latitude: -34.65, longitude: -58.43, address: 'Client Site C' },
    plannedDate: '2025-01-28',
    plannedStartTime: '13:00',
    plannedEndTime: '16:00',
    vehicleId: 'veh-002',
    vehiclePlate: 'TK-002',
    driverId: 'u2',
    driverName: 'Maria Santos',
    plannedVolumeLiters: 12000,
    status: 'planned',
    createdBy: 'planner',
    createdAt: new Date().toISOString(),
  },
];

export async function listRoutes(): Promise<RoutePlan[]> {
  return Promise.resolve(ROUTES);
}

export interface CreateRoutePayload extends Omit<RoutePlan, 'id' | 'status' | 'createdAt'> {
  status?: RouteStatus;
}

export async function createRoute(payload: CreateRoutePayload): Promise<RoutePlan> {
  const route: RoutePlan = {
    ...payload,
    id: `route-${Date.now()}`,
    status: payload.status ?? 'planned',
    createdAt: new Date().toISOString(),
  };
  ROUTES = [route, ...ROUTES];
  return Promise.resolve(route);
}

export async function updateRouteStatus(id: string, status: RouteStatus): Promise<RoutePlan | undefined> {
  ROUTES = ROUTES.map(r => r.id === id ? { ...r, status } : r);
  return Promise.resolve(ROUTES.find(r => r.id === id));
}

export async function deleteRoute(id: string): Promise<void> {
  ROUTES = ROUTES.filter(r => r.id !== id);
  return Promise.resolve();
}
