import { ApiClient } from './ApiClient';

// Tipos alineados al backend (Prisma schema)
export type CivilWorkType = 'CONSTRUCTION' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
export type CivilWorkStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'ON_HOLD';

export type CivilWorkSummary = {
  id: number;
  project: string;
  location: string;
  date: string; // ISO string
  workType: CivilWorkType;
  status: CivilWorkStatus;
  progress: number;
  responsibleStaff: string[];
};

export type CivilWork = CivilWorkSummary & {
  tasks: string[];
  timeSpent: number;
  issues: string[];
  observations?: string;
  photos: string[];
  materialsUsed: string[];
  createdBy: { id: number; username: string };
  createdAt: string;
  updatedAt: string;
};

export type PaginatedCivilWorks = {
  items: CivilWorkSummary[];
  total: number;
};

export type CreateCivilWorkInput = {
  project: string;
  location: string;
  date: string; // ISO
  workType: CivilWorkType;
  tasks?: string[];
  timeSpent?: number;
  progress?: number;
  status?: CivilWorkStatus;
  observations?: string;
  issues?: string[];
  photos?: string[];
  responsibleStaffUsernames?: string[];
  materialsUsed?: string[];
};

export type UpdateCivilWorkInput = Partial<CreateCivilWorkInput>;

export const CivilWorksApi = {
  async list(page = 1, pageSize = 20): Promise<PaginatedCivilWorks> {
    const q = `?page=${page}&pageSize=${pageSize}`;
    return ApiClient.get(`/civil-works${q}`, true);
  },
  async get(id: number): Promise<CivilWork> {
    return ApiClient.get(`/civil-works/${id}`, true);
  },
  async create(input: CreateCivilWorkInput): Promise<CivilWork> {
    return ApiClient.post(`/civil-works`, input, true);
  },
  async update(id: number, input: UpdateCivilWorkInput): Promise<CivilWork> {
    return ApiClient.patch(`/civil-works/${id}`, input, true);
  },
  async remove(id: number): Promise<void> {
    return ApiClient.delete(`/civil-works/${id}`, true);
  },
};
