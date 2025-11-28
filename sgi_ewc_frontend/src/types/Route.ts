export type RouteStatus = 'planned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface RouteStop {
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;
}

export interface RoutePlan {
  id: string;
  name: string; // e.g., "Origen → Destino"
  origin: RouteStop;
  destination: RouteStop;
  plannedDate: string; // YYYY-MM-DD
  plannedStartTime?: string; // HH:mm
  plannedEndTime?: string;   // HH:mm
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  plannedVolumeLiters?: number;
  status: RouteStatus;
  createdBy?: string;
  notes?: string;
  createdAt: string;
}
