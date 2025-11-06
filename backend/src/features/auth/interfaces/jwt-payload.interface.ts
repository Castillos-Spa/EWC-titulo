import { ModuleKey, Permission, Role, Specialty } from '@prisma/client';

export interface RolesByArea {
  [area: string]: {
    role: Role;
    specialty: Specialty | null;
    permissions: Permission[];
    isActive: boolean;
  };
}

export interface JwtPayload {
  sub: number;
  tenantId: number;
  tenantSlug: string;
  companyId?: number | null;
  companyIds?: number[];
  modules?: ModuleKey[];
  email: string;
  username: string;
  areas: string[];
  roles: Role[];
  permissions: Permission[];
  rolesByArea: RolesByArea;
  isAdmin: boolean;
  mustChangePassword?: boolean;
  active?: boolean;
}
