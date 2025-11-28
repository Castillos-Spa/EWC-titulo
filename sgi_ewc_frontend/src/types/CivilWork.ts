export type CivilWorkType =
  | "CONSTRUCTION"
  | "REPAIR"
  | "MAINTENANCE"
  | "INSPECTION";
export type CivilWorkStatus =
  | "COMPLETED"
  | "IN_PROGRESS"
  | "PENDING"
  | "ON_HOLD";

export interface CivilWorkTask {
  name: string;
  completed: boolean;
}

export interface CivilWork {
  id: number;
  project: string;
  location: string;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string | null;
  workType: CivilWorkType;
  tasks: CivilWorkTask[];
  progress: number;
  status: CivilWorkStatus;
  observations?: string;
  issues: string[];
  photos: string[];
  createdById: number;
  responsibleStaffUsernames: string[];
  materialsUsed: string[];
}

// Este tipo se usa para el payload de creación
export interface CreateCivilWorkPayload {
  project: string;
  location: string;
  startDate: string;
  estimatedEndDate: string;
  workType: CivilWorkType;
  tasks?: string[];
  progress?: number;
  status?: CivilWorkStatus;
  observations?: string;
  issues?: string[];
  responsibleStaffUsernames?: string[];
  materialsUsed?: string[];
}
