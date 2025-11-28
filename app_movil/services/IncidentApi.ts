import { ApiClient } from './ApiClient';

export type BackIncidentType =
  | 'VEHICLE_BREAKDOWN'
  | 'ACCIDENT'
  | 'TRAFFIC_DELAY'
  | 'WEATHER'
  | 'SECURITY'
  | 'OTHER';

export type BackIncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type BackIncidentStatus = 'REPORTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';

export interface BackIncident {
  id: number;
  title: string;
  description: string;
  area: string;
  type: BackIncidentType;
  severity: BackIncidentSeverity;
  status: BackIncidentStatus;
  location?: unknown;
  photos?: string[];
  reportedById?: number | null;
  reportedByName?: string | null;
  reportedBy?: string | null;
  reportedAt: string;
  reviewedAt?: string | null;
  reviewedById?: number | null;
  updatedAt?: string;
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
};

export interface IncidentPhotosResponse {
  id: number;
  photos: string[];
}

export type CreateIncidentInput = {
  Title: string;
  Description: string;
  Area: string;
  Tipo: BackIncidentType;
  Severidad: BackIncidentSeverity;
  Direccion?: string;
  Latitude?: number;
  Longitude?: number;
  Fecha?: string;
};

export type UpdateIncidentInput = Partial<{
  Title: string;
  Description: string;
  Area: string;
  Tipo: BackIncidentType;
  Severidad: BackIncidentSeverity;
  Status: BackIncidentStatus;
  Direccion: string;
  Latitude: number;
  Longitude: number;
}>;

export type IncidentFilePayload = {
  uri: string;
  name: string;
  type: string;
};

export const IncidentApi = {
  async list(page = 1, pageSize = 20): Promise<Paginated<BackIncident>> {
    const q = `?page=${page}&pageSize=${pageSize}`;
    return ApiClient.get(`/incident${q}`, true);
  },
  async get(id: number): Promise<BackIncident> {
    return ApiClient.get(`/incident/${id}`, true);
  },
  async create(input: CreateIncidentInput): Promise<BackIncident> {
    const payload = {
      ...input,
      title: input.Title,
      description: input.Description,
      area: input.Area,
      type: input.Tipo,
      severity: input.Severidad,
    };
    return ApiClient.post(`/incident`, payload, true);
  },
  async update(id: number, input: UpdateIncidentInput): Promise<BackIncident> {
    const payload: Record<string, unknown> = { ...input };
    if (input.Title !== undefined) payload.title = input.Title;
    if (input.Description !== undefined) payload.description = input.Description;
    if (input.Area !== undefined) payload.area = input.Area;
    if (input.Tipo !== undefined) payload.type = input.Tipo;
    if (input.Severidad !== undefined) payload.severity = input.Severidad;
    if (input.Status !== undefined) payload.status = input.Status;
    return ApiClient.patch(`/incident/${id}`, payload, true);
  },
  async uploadPhotos(id: number, files: IncidentFilePayload[]): Promise<IncidentPhotosResponse> {
    if (!files.length) {
      return { id, photos: [] };
    }
    const form = new FormData();
    files.forEach((file) => {
      form.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'image/jpeg',
      } as any);
    });
    return ApiClient.upload(`/incident/${id}/photos`, form, true);
  },
  async getPhotos(id: number): Promise<IncidentPhotosResponse> {
    return ApiClient.get(`/incident/${id}/photos`, true);
  },
  async remove(id: number): Promise<void> {
    return ApiClient.delete(`/incident/${id}`, true);
  },
};
