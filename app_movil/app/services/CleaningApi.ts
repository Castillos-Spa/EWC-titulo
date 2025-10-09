import { ApiClient } from './ApiClient';

export type CleaningRecord = {
  id: number;
  date: string; // ISO string
  area: string;
  responsibleStaff: string;
  timeSpent: number;
  status: 'COMPLETED' | 'PARTIAL' | 'PENDING' | string;
  tasks?: string[];
  issues?: string[];
  observations?: string | null;
  updatedAt?: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateCleaningInput = {
  date: string; // ISO date string
  area: string;
  tasks?: string[];
  responsibleStaff: string;
  timeSpent: number; // minutes
  issues?: string[];
  status: 'COMPLETED' | 'PARTIAL' | 'PENDING';
  observations?: string;
};

export type UpdateCleaningInput = Partial<CreateCleaningInput>;

export const CleaningApi = {
  async list(page = 1, pageSize = 20): Promise<Paginated<CleaningRecord>> {
    const q = `?page=${page}&pageSize=${pageSize}`;
    return ApiClient.get(`/aseo${q}`, true);
  },
  async get(id: number): Promise<CleaningRecord> {
    return ApiClient.get(`/aseo/${id}`, true);
  },
  async create(input: CreateCleaningInput): Promise<CleaningRecord> {
    return ApiClient.post(`/aseo`, input, true);
  },
  async update(id: number, input: UpdateCleaningInput): Promise<CleaningRecord> {
    return ApiClient.patch(`/aseo/${id}`, input, true);
  },
  async remove(id: number): Promise<void> {
    return ApiClient.delete(`/aseo/${id}`, true);
  },
};
