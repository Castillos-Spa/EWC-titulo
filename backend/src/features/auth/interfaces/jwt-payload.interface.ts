import { Permission, Role, Specialty } from '@prisma/client';

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
  email: string;
  username: string;
  areas: string[];
  roles: Role[];
  permissions: Permission[];
  rolesByArea: RolesByArea;
  isAdmin: boolean;
  mustChangePassword?: boolean;
  active?: boolean;
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}
