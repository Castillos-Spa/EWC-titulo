import { create } from 'zustand';
import { IncidentApi, type Incident as ApiIncident, type CreateIncidentInput } from '../services/IncidentApi';
import { useAuthStore } from './authStore';

export interface Incident {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  photos?: string[];
  reportedBy?: string;
  reportedAt: string;
  status: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  routeId?: string;
  vehicleId?: string;
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  supervisorNotes?: string;
}

interface IncidentState {
  incidents: Incident[];
  currentIncident: Incident | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  loadIncidents: () => Promise<void>;
  createIncident: (incidentData: Omit<Incident, 'id' | 'reportedAt' | 'syncStatus'>) => Promise<void>;
  updateIncidentStatus: (incidentId: string, status: Incident['status']) => Promise<void>;
  addIncidentPhoto: (incidentId: string, photoUri: string) => void;
  setCurrentIncident: (incident: Incident | null) => void;
  clearError: () => void;
}

function mapApiToUi(i: ApiIncident): Incident {
  return {
    id: String(i.id),
    title: i.title,
    description: i.description || '',
    type: (i.type || 'other').toString().toLowerCase(),
    severity: (i.severity || 'medium').toString().toLowerCase(),
    status: (i.status || 'reported').toString().toLowerCase(),
    reportedAt: i.reportedAt || new Date().toISOString(),
    // location y photos pueden venir solo en get(id); mantener opcionales
  };
}

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: [],
  currentIncident: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { items } = await IncidentApi.list(1, 50);
      const mapped = items.map(mapApiToUi);
      set({ incidents: mapped, isLoading: false });
    } catch (error: any) {
      console.error('Error al cargar incidentes:', error);
      set({ error: error?.message || 'Error al cargar incidentes', isLoading: false });
    }
  },

  createIncident: async (incidentData) => {
    set({ isSubmitting: true, error: null });
    try {
      // Mapear a DTO del backend
      const user = useAuthStore.getState().user;
      const sev = String(incidentData.severity || 'medium').toLowerCase();
      let sevBackend: CreateIncidentInput['Severidad'] = 'MEDIUM';
      if (sev === 'high' || sev === 'critical') {
        sevBackend = 'HIGH';
      } else if (sev === 'low') {
        sevBackend = 'LOW';
      }
      const input: CreateIncidentInput = {
        Area: user?.department ? String(user.department) : 'General',
        Descripcion: incidentData.description,
        Tipo: incidentData.type,
        Severidad: sevBackend,
        Direccion: incidentData.location?.address,
        Latitude: typeof incidentData.location?.latitude === 'number' ? incidentData.location?.latitude : undefined,
        Longitude: typeof incidentData.location?.longitude === 'number' ? incidentData.location?.longitude : undefined,
        Fecha: new Date().toISOString(),
      };
      const created = await IncidentApi.create(input);
      const ui = mapApiToUi(created);
      set(state => ({ incidents: [ui, ...state.incidents], isSubmitting: false }));
    } catch (error) {
      console.error('Error al crear incidente:', error);
      set({ error: 'Error al crear incidente', isSubmitting: false });
    }
  },

  updateIncidentStatus: async (incidentId: string, status: Incident['status']) => {
    try {
      await IncidentApi.update(Number(incidentId), { Status: String(status).toUpperCase() });
      set(state => ({
        incidents: state.incidents.map(incident =>
          incident.id === incidentId 
            ? { ...incident, status }
            : incident
        ),
      }));
    } catch (error) {
      console.error('Error al actualizar incidente:', error);
      set({ error: 'Error al actualizar incidente' });
    }
  },

  addIncidentPhoto: (incidentId: string, photoUri: string) => {
    set(state => ({
      incidents: state.incidents.map(incident =>
        incident.id === incidentId
          ? { ...incident, photos: [ ...(incident.photos ?? []), photoUri ] }
          : incident
      ),
      currentIncident: state.currentIncident?.id === incidentId
        ? { ...state.currentIncident, photos: [ ...(state.currentIncident?.photos ?? []), photoUri ] }
        : state.currentIncident,
    }));
  },

  setCurrentIncident: (incident: Incident | null) => {
    set({ currentIncident: incident });
  },

  clearError: () => {
    set({ error: null });
  },
}));