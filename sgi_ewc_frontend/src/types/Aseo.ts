export type CleaningStatus = "COMPLETED" | "PARTIAL" | "PENDING";

export interface Aseo {
  id: string;
  date: string; // ISO
  area: string;
  tasks: string[];
  responsibleStaff: string;
  timeSpent: number;
  issues: string[];
  status: CleaningStatus;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}
