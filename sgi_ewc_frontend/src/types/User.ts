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
export type Permission = string; // O un enum más específico si lo tienes

export interface RoleAssignment {
  area: string;
  role: Role;
  specialty?: Specialty | null;
  additionalPermissions?: Permission[];
  isActive?: boolean;
}

export interface RolesByArea {
  [area: string]: {
    role: Role;
    specialty?: Specialty | null;
    permissions: Permission[];
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  areas: string[];
  roles: Role[];
  roleAssignments: RoleAssignment[];
  rolesByArea: RolesByArea;
  isAdmin: boolean;
  active: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  mustChangePassword?: boolean;
}
