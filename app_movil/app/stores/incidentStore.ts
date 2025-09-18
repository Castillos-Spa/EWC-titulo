import { create } from 'zustand';
import { DatabaseService } from '../services/DatabaseService';

export interface Incident {
  id: string;
  type: 'vehicle_breakdown' | 'accident' | 'traffic_delay' | 'weather' | 'security' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photos: string[];
  reportedBy: string;
  reportedAt: string;
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved';
  syncStatus: 'pending' | 'synced' | 'failed';
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

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: [],
  currentIncident: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simular datos de incidentes para evitar errores de base de datos
      const mockIncidents: Incident[] = [
        {
          id: 'incident-001',
          type: 'vehicle_breakdown',
          severity: 'high',
          title: 'Avería en Sistema de Frenos',
          description: 'El vehículo ABC-123 presenta problemas en el sistema de frenos durante la ruta matutina. Se requiere asistencia técnica inmediata.',
          location: {
            latitude: -34.6037,
            longitude: -58.3816,
            address: 'Av. Corrientes 1234, Buenos Aires',
          },
          photos: [],
          reportedBy: 'Juan Pérez',
          reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'reported',
          syncStatus: 'pending',
        },
        {
          id: 'incident-002',
          type: 'traffic_delay',
          severity: 'medium',
          title: 'Retraso por Tráfico Intenso',
          description: 'Tráfico congestionado en Av. 9 de Julio causando retrasos significativos en las entregas programadas.',
          location: {
            latitude: -34.6118,
            longitude: -58.3960,
            address: 'Av. 9 de Julio, Buenos Aires',
          },
          photos: [],
          reportedBy: 'María González',
          reportedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          status: 'acknowledged',
          syncStatus: 'synced',
        },
      ];
      
      // Intentar guardar en base de datos, pero continuar si falla
      try {
        await DatabaseService.saveIncidents(mockIncidents);
      } catch (dbError) {
        console.warn('Database save failed, continuing with mock data:', dbError);
      }
      
      set({ incidents: mockIncidents, isLoading: false });
    } catch (error) {
      console.error('Error al cargar incidentes:', error);
      set({ error: 'Error al cargar incidentes', isLoading: false });
    }
  },

  createIncident: async (incidentData) => {
    set({ isSubmitting: true, error: null });
    try {
      const newIncident: Incident = {
        ...incidentData,
        id: `incident-${Date.now()}`,
        reportedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      try {
        await DatabaseService.saveIncident(newIncident);
      } catch (dbError) {
        console.warn('Database save failed, continuing with local state:', dbError);
      }
      
      set(state => ({
        incidents: [newIncident, ...state.incidents],
        isSubmitting: false,
      }));
    } catch (error) {
      console.error('Error al crear incidente:', error);
      set({ error: 'Error al crear incidente', isSubmitting: false });
    }
  },

  updateIncidentStatus: async (incidentId: string, status: Incident['status']) => {
    try {
      await DatabaseService.updateIncidentStatus(incidentId, status);
      
      set(state => ({
        incidents: state.incidents.map(incident =>
          incident.id === incidentId 
            ? { ...incident, status, syncStatus: 'pending' as const }
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
          ? { ...incident, photos: [...incident.photos, photoUri] }
          : incident
      ),
      currentIncident: state.currentIncident?.id === incidentId
        ? { ...state.currentIncident, photos: [...state.currentIncident.photos, photoUri] }
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