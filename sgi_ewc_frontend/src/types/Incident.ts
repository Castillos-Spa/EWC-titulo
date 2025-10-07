export type IncidentType =
  | "vehicle_breakdown"
  | "accident"
  | "traffic_delay"
  | "weather"
  | "security"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus =
  | "reported"
  | "acknowledged"
  | "in_progress"
  | "resolved";

export interface Incident {
  id: string;
  area: string; // Área responsable/relacionada (Transporte, Taller, Aseo, IT, etc.)
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  // Location puede venir como coordenadas o JSON arbitrario del backend
  location:
    | {
        latitude: number;
        longitude: number;
        address?: string;
      }
    | Record<string, unknown>;
  photos: string[];
  // En frontend mostramos nombre, pero backend usa reportedById
  reportedBy: string;
  reportedById?: number;
  reportedAt: string; // ISO
  status: IncidentStatus;
  syncStatus: "pending" | "synced" | "failed";
  routeId?: string;
  vehicleId?: string;
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  supervisorNotes?: string;
  // Campos adicionales del backend
  reviewedAt?: string | null;
  reviewedById?: number | null;
  updatedAt?: string;
}
