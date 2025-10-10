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

export interface CivilWorkMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

export interface ResponsibleStaff {
  id: number;
  username: string;
}

export interface CivilWork {
  id: number;
  date: string; // ISO Date String
  project: string;
  location: string;
  workType: CivilWorkType;
  tasks: string[];
  responsibleStaff: ResponsibleStaff[];
  materialsUsed: CivilWorkMaterial[];
  timeSpent: number;
  progress: number;
  issues: string[];
  status: CivilWorkStatus;
  observations: string | null;
  photos?: string[];
}
