import { create } from 'zustand';
import {
  IncidentApi,
  type BackIncident,
  type BackIncidentSeverity,
  type BackIncidentStatus,
  type BackIncidentType,
  type CreateIncidentInput,
  type IncidentFilePayload,
} from '../services/IncidentApi';
import { useAuthStore } from './authStore';
import type { User } from './authStore';

export type IncidentType = 'vehicle_breakdown' | 'accident' | 'traffic_delay' | 'weather' | 'security' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'acknowledged' | 'in_progress' | 'resolved';

export interface IncidentLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface Incident {
  id: string;
  area: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: IncidentLocation;
  photos: string[];
  reportedBy?: string;
  reportedById?: string;
  reportedAt: string;
  status: IncidentStatus;
  syncStatus: 'pending' | 'synced' | 'failed';
  updatedAt?: string;
  reviewedAt?: string | null;
  reviewedById?: string;
}

export interface CapturedPhoto {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface CreateIncidentPayload {
  area?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: IncidentLocation;
  attachments: CapturedPhoto[];
}

interface IncidentState {
  incidents: Incident[];
  currentIncident: Incident | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  loadIncidents: () => Promise<void>;
  loadIncidentDetail: (id: string) => Promise<void>;
  createIncident: (payload: CreateIncidentPayload) => Promise<Incident | null>;
  updateIncidentStatus: (incidentId: string, status: IncidentStatus) => Promise<void>;
  setCurrentIncident: (incident: Incident | null) => void;
  clearError: () => void;
}

const TYPE_TO_BACK: Record<IncidentType, BackIncidentType> = {
  vehicle_breakdown: 'VEHICLE_BREAKDOWN',
  accident: 'ACCIDENT',
  traffic_delay: 'TRAFFIC_DELAY',
  weather: 'WEATHER',
  security: 'SECURITY',
  other: 'OTHER',
};

const SEVERITY_TO_BACK: Record<IncidentSeverity, BackIncidentSeverity> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
};

const STATUS_TO_BACK: Record<IncidentStatus, BackIncidentStatus> = {
  reported: 'REPORTED',
  acknowledged: 'ACKNOWLEDGED',
  in_progress: 'IN_PROGRESS',
  resolved: 'RESOLVED',
};

const TYPE_FROM_BACK: Record<BackIncidentType, IncidentType> = {
  VEHICLE_BREAKDOWN: 'vehicle_breakdown',
  ACCIDENT: 'accident',
  TRAFFIC_DELAY: 'traffic_delay',
  WEATHER: 'weather',
  SECURITY: 'security',
  OTHER: 'other',
};

const SEVERITY_FROM_BACK: Record<BackIncidentSeverity, IncidentSeverity> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const STATUS_FROM_BACK: Record<BackIncidentStatus, IncidentStatus> = {
  REPORTED: 'reported',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
};

function normalizeLocation(raw: unknown): IncidentLocation | undefined {
  if (!raw) return undefined;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length ? { address: trimmed } : undefined;
  }

  if (typeof raw !== 'object' || raw === null) return undefined;

  const source = raw as Record<string, unknown>;

  const getFirstString = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
    for (const key of keys) {
      const val = obj[key];
      if (typeof val === 'string' && val.trim().length) return val.trim();
    }
    return undefined;
  };

  const toNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const address = getFirstString(source, ['address', 'Address', 'direccion', 'Direccion']);
  const latitude = toNumber(source.latitude ?? source.Latitude ?? source.lat);
  const longitude = toNumber(source.longitude ?? source.Longitude ?? source.lng);

  const payload: IncidentLocation = {};
  if (typeof latitude === 'number') payload.latitude = latitude;
  if (typeof longitude === 'number') payload.longitude = longitude;
  if (address) payload.address = address;

  return Object.keys(payload).length ? payload : undefined;
}

function mapBackIncidentToIncident(back: BackIncident): Incident {
  const reportedByName = typeof back.reportedByName === 'string' ? back.reportedByName.trim() : '';
  const reportedByRaw = typeof back.reportedBy === 'string' ? back.reportedBy.trim() : '';
  let reportedBy: string | undefined;
  if (reportedByName) {
    reportedBy = reportedByName;
  } else if (reportedByRaw) {
    reportedBy = reportedByRaw;
  } else if (typeof back.reportedById === 'number' || typeof back.reportedById === 'string') {
    reportedBy = String(back.reportedById);
  }

  const reportedById =
    typeof back.reportedById === 'number' || typeof back.reportedById === 'string' ? String(back.reportedById) : undefined;
  const reviewedById =
    typeof back.reviewedById === 'number' || typeof back.reviewedById === 'string' ? String(back.reviewedById) : undefined;

  return {
    id: String(back.id),
    area: back.area ?? 'Transporte',
    type: TYPE_FROM_BACK[back.type] ?? 'other',
    severity: SEVERITY_FROM_BACK[back.severity] ?? 'medium',
    title: back.title ?? 'Incidente',
    description: back.description ?? '',
    location: normalizeLocation(back.location),
    photos: Array.isArray(back.photos) ? back.photos : [],
    reportedBy,
    reportedById,
    reportedAt: back.reportedAt ?? new Date().toISOString(),
    status: STATUS_FROM_BACK[back.status] ?? 'reported',
    syncStatus: 'synced',
    updatedAt: back.updatedAt,
    reviewedAt: back.reviewedAt ?? undefined,
    reviewedById,
  };
}

function mergeIncidentList(list: Incident[], next: Incident): Incident[] {
  const exists = list.findIndex((item) => item.id === next.id);
  if (exists === -1) {
    return [next, ...list];
  }
  const clone = [...list];
  clone[exists] = { ...clone[exists], ...next, photos: next.photos.length ? next.photos : clone[exists].photos };
  return clone;
}

function inferArea(user: User | null): string {
  const KNOWN_AREAS = new Set(['Transporte', 'Aseo', 'Obras', 'IT', 'Admin', 'RRHH', 'Finanzas', 'Prev_Riesgo']);
  if (user?.areaIds?.length) {
    const candidate = user.areaIds.find((area) => KNOWN_AREAS.has(area));
    if (candidate) return candidate;
  }

  const departmentMap: Record<User['department'], string> = {
    transport: 'Transporte',
    cleaning: 'Aseo',
    civil_works: 'Obras',
    it: 'IT',
    management: 'Admin',
    finance: 'Finanzas',
  };

  if (user?.department && departmentMap[user.department]) {
    return departmentMap[user.department];
  }

  return 'Transporte';
}

function toFilePayload(photo: CapturedPhoto): IncidentFilePayload {
  return {
    uri: photo.uri,
    name: photo.name,
    type: photo.type || 'image/jpeg',
  };
}

async function uploadIncidentPhotos(incidentId: number, attachments: CapturedPhoto[]): Promise<string[]> {
  if (!attachments.length) return [];
  const files = attachments.map(toFilePayload);
  const photosResponse = await IncidentApi.uploadPhotos(incidentId, files);
  return Array.isArray(photosResponse.photos) ? photosResponse.photos : [];
}

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: [],
  currentIncident: null,
  isLoading: false,
  isDetailLoading: false,
  isSubmitting: false,
  error: null,

  loadIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { items } = await IncidentApi.list(1, 100);
      const mapped = items.map(mapBackIncidentToIncident);
      set({ incidents: mapped, isLoading: false });
    } catch (error: any) {
      console.error('Error al cargar incidentes:', error);
      set({ error: error?.message || 'Error al cargar incidentes', isLoading: false });
    }
  },

  loadIncidentDetail: async (id: string) => {
    set({ isDetailLoading: true });
    try {
      const detail = await IncidentApi.get(Number(id));
      const mapped = mapBackIncidentToIncident(detail);
      set((state) => ({
        currentIncident: state.currentIncident?.id === mapped.id ? { ...state.currentIncident, ...mapped } : mapped,
        incidents: mergeIncidentList(state.incidents, mapped),
        isDetailLoading: false,
      }));
    } catch (error: any) {
      console.error('Error al cargar el detalle del incidente:', error);
      set({ error: error?.message || 'Error al cargar el detalle', isDetailLoading: false });
    }
  },

  createIncident: async (payload: CreateIncidentPayload) => {
    set({ isSubmitting: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      const requestedArea = payload.area?.trim();
      const area = requestedArea && requestedArea.length > 0 ? requestedArea : inferArea(user ?? null);
      const input: CreateIncidentInput = {
        Title: payload.title.trim(),
        Description: payload.description.trim(),
        Area: area,
        Tipo: TYPE_TO_BACK[payload.type] ?? 'OTHER',
        Severidad: SEVERITY_TO_BACK[payload.severity] ?? 'MEDIUM',
        Direccion: payload.location?.address,
        Latitude: payload.location?.latitude,
        Longitude: payload.location?.longitude,
        Fecha: new Date().toISOString(),
      };

      const created = await IncidentApi.create(input);
      let mapped = mapBackIncidentToIncident(created);

      try {
        const receivedPhotos = await uploadIncidentPhotos(Number(created.id), payload.attachments);
        if (receivedPhotos.length) {
          mapped = { ...mapped, photos: receivedPhotos };
        } else if (payload.attachments.length) {
          const refreshed = await IncidentApi.get(Number(created.id));
          mapped = mapBackIncidentToIncident(refreshed);
        }
      } catch (uploadError) {
        console.warn('No se pudieron subir las evidencias del incidente:', uploadError);
        set({ error: 'Incidente creado, pero algunas fotos no se pudieron subir.' });
      }

      set((state) => ({
        incidents: mergeIncidentList(state.incidents, mapped),
        currentIncident: mapped,
        isSubmitting: false,
      }));
      return mapped;
    } catch (error: any) {
      console.error('Error al crear incidente:', error);
      set({ error: error?.message || 'Error al crear incidente', isSubmitting: false });
      return null;
    }
  },

  updateIncidentStatus: async (incidentId: string, status: IncidentStatus) => {
    try {
      const updated = await IncidentApi.update(Number(incidentId), { Status: STATUS_TO_BACK[status] });
      const mapped = mapBackIncidentToIncident(updated);
      set((state) => ({
        incidents: mergeIncidentList(state.incidents, mapped),
        currentIncident: state.currentIncident?.id === mapped.id ? { ...state.currentIncident, ...mapped } : state.currentIncident,
      }));
    } catch (error: any) {
      console.error('Error al actualizar incidente:', error);
      set({ error: error?.message || 'Error al actualizar incidente' });
      throw error;
    }
  },

  setCurrentIncident: (incident: Incident | null) => {
    set({ currentIncident: incident });
  },

  clearError: () => {
    set({ error: null });
  },
}));