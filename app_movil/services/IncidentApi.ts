import { ApiClient } from './ApiClient';

export type Incident = {
  id: number;
  title: string;
  description?: string;
  area?: string;
  type?: string;
  severity?: string;
  status?: string;
  reportedAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateIncidentInput = {
  Area: string;
  Descripcion?: string;
  Tipo?: string;
  Severidad?: 'LOW' | 'MEDIUM' | 'HIGH';
  Direccion?: string;
  Latitude?: number;
  Longitude?: number;
  Fecha?: string;
};

export type UpdateIncidentInput = Partial<CreateIncidentInput> & { Status?: string; Title?: string };

export const IncidentApi = {
  async list(page = 1, pageSize = 20): Promise<Paginated<Incident>> {
    const q = `?page=${page}&pageSize=${pageSize}`;
    return ApiClient.get(`/incident${q}`, true);
  },
  async get(id: number): Promise<Incident> {
    return ApiClient.get(`/incident/${id}`, true);
  },
  async create(input: CreateIncidentInput): Promise<Incident> {
    return ApiClient.post(`/incident`, input, true);
  },
  async update(id: number, input: UpdateIncidentInput): Promise<Incident> {
    return ApiClient.patch(`/incident/${id}`, input, true);
  },
  async remove(id: number): Promise<void> {
    return ApiClient.delete(`/incident/${id}`, true);
  },
};
