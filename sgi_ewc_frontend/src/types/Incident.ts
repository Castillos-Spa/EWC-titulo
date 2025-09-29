export type IncidentType =
  | 'vehicle_breakdown'
  | 'accident'
  | 'traffic_delay'
  | 'weather'
  | 'security'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'acknowledged' | 'in_progress' | 'resolved';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photos: string[];
  reportedBy: string;
  reportedAt: string; // ISO
  status: IncidentStatus;
  syncStatus: 'pending' | 'synced' | 'failed';
  routeId?: string;
  vehicleId?: string;
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  supervisorNotes?: string;
}
