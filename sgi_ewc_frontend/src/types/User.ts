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

export type TenantStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type CompanyStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type BackendModuleKey =
  | "DASHBOARD"
  | "INCIDENTS"
  | "TICKETS"
  | "NOTIFICATIONS"
  | "USERS"
  | "FLEET"
  | "FUEL"
  | "ROUTES"
  | "CLEANING"
  | "CIVIL_WORK"
  | "MAINTENANCE"
  | "PURCHASING"
  | "HR"
  | "FINANCE"
  | "SAFETY"
  | "ANALYTICS"
  | "CUSTOM";

export interface RoleAssignment {
  area: string;
  role: Role;
  specialty?: Specialty | null;
  additionalPermissions?: string[];
  permissions?: string[];
  isActive?: boolean;
  companyId?: number | null;
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
  tenantId?: number;
  tenantSlug?: string | null;
  companyId?: number | null;
  companyIds?: number[];
  modules?: BackendModuleKey[];
  tenantModules?: BackendModuleKey[];
  restrictedModules?: BackendModuleKey[];
  moduleMap?: ModuleAccessSnapshot;
}

export interface TenantSummary {
  id: number;
  slug: string;
  name: string;
  status: TenantStatus;
}

export interface TenantCompany {
  id: number;
  name: string;
  status: CompanyStatus;
  isDefault: boolean;
}

export interface TenantAccessOption {
  tenant: TenantSummary;
  defaultCompanyId: number | null;
  companies: TenantCompany[];
  requiresCompanySelection: boolean;
}

export interface AuthDiscoveryResponse {
  email: string;
  tenants: TenantAccessOption[];
}

export interface ClientAuthSession {
  user: User;
  tenant: TenantSummary | null;
  companyId: number | null;
  companies: TenantCompany[];
  modules: BackendModuleKey[];
  tenantModules?: BackendModuleKey[];
  restrictedModules?: BackendModuleKey[];
  moduleMap?: ModuleAccessSnapshot;
}

export interface ModuleStatusBuckets {
  active: BackendModuleKey[];
  trial: BackendModuleKey[];
  inactive: BackendModuleKey[];
  pending: BackendModuleKey[];
  enabled: BackendModuleKey[];
  disabled: BackendModuleKey[];
}

export interface ModuleAccessSnapshot {
  tenant: ModuleStatusBuckets;
  user: {
    enabled: BackendModuleKey[];
    restricted: BackendModuleKey[];
  };
}
