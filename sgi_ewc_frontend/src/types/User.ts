// Tipos importados desde el backend para consistencia
export type Role =
  | "Admin"
  | "Jefe"
  | "Supervisor"
  | "Especialista"
  | "Trabajador"
  | "Lector";
export type Specialty =
  | "DRIVER"
  | "MECHANIC"
  | "CIVIL_ENGINEER"
  | "CLEANING_COORDINATOR"
  | "HR_SPECIALIST"
  | "ACCOUNTANT"
  | "SAFETY_INSPECTOR"
  | "IT_SUPPORT";

export interface RoleAssignment {
  area: string;
  role: Role;
  specialty?: Specialty | null;
  additionalPermissions?: string[];
  permissions?: string[];
  isActive?: boolean;
}

export interface RolesByArea {
  [area: string]: {
    role: Role;
    specialty?: Specialty | null;
    permissions: string[];
    isActive?: boolean;
  };
}

export interface User {
  id: number;
  username: string;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  areas: string[];
  roles: Role[];
  permissions?: string[];
  roleAssignments: RoleAssignment[];
  rolesByArea: RolesByArea;
  isAdmin: boolean;
  active: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  mustChangePassword?: boolean;
}
