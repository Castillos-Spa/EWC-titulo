import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dtos/register.dto';
import { JwtPayload, RolesByArea } from './interfaces/jwt-payload.interface';
import { PrismaService } from 'prisma/prisma.service';
import { Area, CompanyStatus, ModuleKey, ModuleStatus, Permission, Prisma, Role, TenantStatus } from '@prisma/client';

type TenantWithRelations = Prisma.TenantGetPayload<{
  include: {
    modules: true;
    companies: true;
  };
}>;

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    roleAssignments: true;
    userCompanies: true;
  };
}>;

type UserWithTenantAndCompanies = Prisma.UserGetPayload<{
  include: {
    tenant: true;
    userCompanies: {
      include: {
        company: true;
      };
    };
  };
}>;

export interface AuthUserDetails {
  id: number;
  username: string;
  email: string;
  areas: string[];
  roles: Role[];
  rolesByArea: RolesByArea;
  isAdmin: boolean;
  mustChangePassword: boolean;
  active: boolean;
  tenantId: number;
  tenantSlug: string;
  companyId: number | null;
  companyIds: number[];
  modules: ModuleKey[];
  tenantModules: ModuleKey[];
  restrictedModules: ModuleKey[];
}

export interface AuthSession {
  userId: number;
  user: Omit<UserWithRelations, 'password'>;
  tenant: TenantWithRelations;
  modules: ModuleKey[];
  tenantModules: ModuleKey[];
  companies: Array<{ id: number; name: string; status: CompanyStatus; isDefault: boolean }>;
  companyId: number | null;
  payload: JwtPayload;
  userDetails: AuthUserDetails;
  moduleMap: ModuleAccessSnapshot;
}

export interface ModuleStatusBuckets {
  active: ModuleKey[];
  trial: ModuleKey[];
  inactive: ModuleKey[];
  pending: ModuleKey[];
  enabled: ModuleKey[];
  disabled: ModuleKey[];
}

export interface ModuleAccessSnapshot {
  tenant: ModuleStatusBuckets;
  user: {
    enabled: ModuleKey[];
    restricted: ModuleKey[];
  };
}

export interface TenantAccessOption {
  tenant: {
    id: number;
    slug: string;
    name: string;
    status: TenantStatus;
  };
  defaultCompanyId: number | null;
  companies: Array<{ id: number; name: string; status: CompanyStatus; isDefault: boolean }>;
  requiresCompanySelection: boolean;
}

export interface AuthDiscoveryResult {
  email: string;
  tenants: TenantAccessOption[];
}

interface RefreshTokenPayload {
  sub: number;
  email: string;
  tenantId?: number;
  companyId?: number | null;
}

type RoleAssignment = NonNullable<UserWithRelations['roleAssignments']>[number];
type UserCompanyMembership = NonNullable<UserWithRelations['userCompanies']>[number];
type UserCompanyWithCompany = UserCompanyMembership & {
  company?: {
    id: number;
    name: string;
    status: CompanyStatus;
  };
};

interface ModuleAccessRule {
  anyPermissions?: Permission[];
  areas?: Area[];
  always?: boolean;
}

const MODULE_ACCESS_RULES: Record<ModuleKey, ModuleAccessRule> = {
  [ModuleKey.DASHBOARD]: { always: true },
  [ModuleKey.INCIDENTS]: {
    anyPermissions: [
      Permission.VIEW_RISK_ASSESSMENTS,
      Permission.MANAGE_RISK_ASSESSMENTS,
      Permission.CREATE_SAFETY_PROTOCOLS,
    ],
    areas: [Area.Prev_Riesgo, Area.Transporte, Area.Obras],
  },
  [ModuleKey.TICKETS]: {
    anyPermissions: [Permission.VIEW_TICKETS, Permission.MANAGE_TICKETS],
  },
  [ModuleKey.NOTIFICATIONS]: { always: true },
  [ModuleKey.USERS]: {
    anyPermissions: [Permission.VIEW_MANAGEMENT_USER, Permission.MANAGE_MANAGEMENT_USER],
    areas: [Area.IT, Area.Admin],
  },
  [ModuleKey.FLEET]: {
    anyPermissions: [Permission.MANAGE_FLEET, Permission.VIEW_FLEET],
    areas: [Area.Transporte],
  },
  [ModuleKey.FUEL]: {
    anyPermissions: [Permission.VIEW_TRIP_REPORTS, Permission.MANAGE_TRIP_REPORTS],
    areas: [Area.Transporte],
  },
  [ModuleKey.ROUTES]: {
    anyPermissions: [Permission.VIEW_ROUTES, Permission.MANAGE_ROUTES],
    areas: [Area.Transporte],
  },
  [ModuleKey.CLEANING]: {
    anyPermissions: [Permission.VIEW_CLEANING_REPORTS, Permission.MANAGE_CLEANING_REPORTS],
    areas: [Area.Aseo],
  },
  [ModuleKey.CIVIL_WORK]: {
    anyPermissions: [Permission.VIEW_CIVIL_WORKS, Permission.MANAGE_CIVIL_WORKS],
    areas: [Area.Obras],
  },
  [ModuleKey.MAINTENANCE]: {
    anyPermissions: [Permission.VIEW_MAINTENANCE, Permission.MANAGE_MAINTENANCE],
    areas: [Area.Transporte],
  },
  [ModuleKey.PURCHASING]: {
    anyPermissions: [Permission.MANAGE_BUDGETS, Permission.APPROVE_EXPENSES],
    areas: [Area.Finanzas, Area.Admin],
  },
  [ModuleKey.HR]: {
    anyPermissions: [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES],
    areas: [Area.RRHH],
  },
  [ModuleKey.FINANCE]: {
    anyPermissions: [Permission.VIEW_FINANCIAL_REPORTS, Permission.MANAGE_BUDGETS, Permission.APPROVE_EXPENSES],
    areas: [Area.Finanzas, Area.Admin],
  },
  [ModuleKey.SAFETY]: {
    anyPermissions: [
      Permission.VIEW_RISK_ASSESSMENTS,
      Permission.MANAGE_RISK_ASSESSMENTS,
      Permission.CREATE_SAFETY_PROTOCOLS,
    ],
    areas: [Area.Prev_Riesgo, Area.Obras],
  },
  [ModuleKey.ANALYTICS]: {
    anyPermissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_FINANCIAL_REPORTS],
    areas: [Area.Admin, Area.IT],
  },
  [ModuleKey.CUSTOM]: { always: true },
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
    tenantSlug: string | undefined,
    requestedCompanyId?: number | null,
  ): Promise<AuthSession | null> {
    if (!tenantSlug) {
      throw new UnauthorizedException('Debe especificar el tenant.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        modules: true,
        companies: true,
      },
    });

    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new UnauthorizedException('El tenant no está disponible.');
    }

    const user = await this.usersService.findByEmail(email, tenant.id);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const typedUser = user as unknown as UserWithRelations;
    const sanitizedUser = this.stripPassword(typedUser);
    return this.buildSessionContext(sanitizedUser, tenant, requestedCompanyId);
  }

  async login(session: AuthSession) {
    const access_token = this.jwtService.sign(session.payload);
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET');

    const refreshPayload = {
      sub: session.user.id,
      email: session.user.email,
      tenantId: session.payload.tenantId,
      companyId: session.companyId,
    };

    const refresh_token = this.jwtService.sign(refreshPayload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      secret: refreshSecret,
    });

    const refreshTokenHash = crypto
      .createHmac('sha256', this.configService.get<string>('REFRESH_TOKEN_SECRET') || '')
      .update(refresh_token)
      .digest('hex');

    await this.usersService.setRefreshToken(session.user.id, refreshTokenHash);
    await this.usersService.updateLastLogin(session.user.id);

    return {
      access_token,
      refresh_token,
      user: session.userDetails,
      tenant: {
        id: session.payload.tenantId,
        name: session.tenant.name,
        slug: session.payload.tenantSlug,
        status: session.tenant.status,
      },
      companyId: session.companyId,
      companies: session.companies,
      modules: session.modules,
      tenantModules: session.tenantModules,
      restrictedModules: session.moduleMap.user.restricted,
      moduleMap: session.moduleMap,
    };
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshToken(userId, null);
  }

  async register(registerDto: RegisterDto) {
    return this.usersService.register(registerDto);
  }

  async refreshToken(token: string) {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET');
      const refreshTokenPayload = this.jwtService.verify<RefreshTokenPayload>(token, { secret: refreshSecret });

      const user = await this.usersService.findById(refreshTokenPayload.sub, refreshTokenPayload.tenantId);

      if (!user || !user.active || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      const incomingHash = crypto
        .createHmac('sha256', this.configService.get<string>('REFRESH_TOKEN_SECRET') || '')
        .update(token)
        .digest('hex');

      if (incomingHash !== user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: refreshTokenPayload.tenantId ?? user.tenantId },
        include: {
          modules: true,
          companies: true,
        },
      });

      if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
        throw new UnauthorizedException('El tenant no está disponible.');
      }

      const typedUser = user as unknown as UserWithRelations;
      const sanitizedUser = this.stripPassword(typedUser);
      const session = this.buildSessionContext(sanitizedUser, tenant, refreshTokenPayload.companyId ?? null);

      const newAccessToken = this.jwtService.sign(session.payload, { expiresIn: '15m' });

      return {
        access_token: newAccessToken,
        user: session.userDetails,
        tenant: {
          id: session.payload.tenantId,
          name: tenant.name,
          slug: session.payload.tenantSlug,
          status: tenant.status,
        },
        companyId: session.companyId,
        companies: session.companies,
        modules: session.modules,
        tenantModules: session.tenantModules,
        restrictedModules: session.moduleMap.user.restricted,
        moduleMap: session.moduleMap,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async discoverAccess(email: string, tenantSlug?: string): Promise<AuthDiscoveryResult> {
    const normalizedEmail = email?.trim();
    if (!normalizedEmail) {
      return { email: '', tenants: [] };
    }

    const where: Prisma.UserWhereInput = {
      email: { equals: normalizedEmail, mode: 'insensitive' },
      active: true,
    };

    if (tenantSlug) {
      where.tenant = { slug: tenantSlug };
    }

    const users = (await this.prisma.user.findMany({
      where,
      include: {
        tenant: true,
        userCompanies: {
          include: {
            company: true,
          },
        },
      },
    })) as UserWithTenantAndCompanies[];

    const tenants = new Map<number, TenantAccessOption>();

    for (const user of users) {
      const option = this.createTenantAccessOption(user);
      if (!option) {
        continue;
      }
      this.mergeTenantAccessOption(tenants, option);
    }

    return {
      email: normalizedEmail.toLowerCase(),
      tenants: Array.from(tenants.values()),
    };
  }

  private createTenantAccessOption(user: UserWithTenantAndCompanies): TenantAccessOption | null {
    if (!user.tenant || user.tenant.status !== TenantStatus.ACTIVE) {
      return null;
    }

    const memberships: UserCompanyWithCompany[] = Array.isArray(user.userCompanies)
      ? (user.userCompanies as UserCompanyWithCompany[])
      : [];

    const companies = memberships
      .filter(
        (
          membership,
        ): membership is UserCompanyWithCompany & { company: NonNullable<UserCompanyWithCompany['company']> } => {
          const { company } = membership;
          if (!company) {
            return false;
          }
          return company.status !== CompanyStatus.ARCHIVED;
        },
      )
      .map(membership => ({
        id: membership.companyId,
        name: membership.company.name,
        status: membership.company.status,
        isDefault: membership.isDefault,
      }));

    const defaultCompanyId = user.primaryCompanyId ?? companies.find(company => company.isDefault)?.id ?? null;

    return {
      tenant: {
        id: user.tenantId,
        slug: user.tenant.slug,
        name: user.tenant.name,
        status: user.tenant.status,
      },
      defaultCompanyId,
      companies,
      requiresCompanySelection: companies.length > 1,
    };
  }

  private mergeTenantAccessOption(target: Map<number, TenantAccessOption>, option: TenantAccessOption): void {
    const existing = target.get(option.tenant.id);
    if (!existing) {
      target.set(option.tenant.id, option);
      return;
    }

    const companiesById = new Map<number, TenantAccessOption['companies'][number]>();
    for (const company of existing.companies) {
      companiesById.set(company.id, company);
    }
    for (const company of option.companies) {
      if (!companiesById.has(company.id)) {
        companiesById.set(company.id, company);
      }
    }

    const mergedCompanies = Array.from(companiesById.values());
    const defaultCompanyId = option.defaultCompanyId ?? existing.defaultCompanyId ?? null;

    target.set(option.tenant.id, {
      tenant: existing.tenant,
      defaultCompanyId,
      companies: mergedCompanies,
      requiresCompanySelection: mergedCompanies.length > 1,
    });
  }

  private buildSessionContext(
    user: Omit<UserWithRelations, 'password'>,
    tenant: TenantWithRelations,
    requestedCompanyId?: number | null,
  ): AuthSession {
    const memberships = this.getCompanyMemberships(user);
    const companyIds = memberships.map(membership => membership.companyId);

    if (requestedCompanyId && !companyIds.includes(requestedCompanyId)) {
      throw new ForbiddenException('No tienes acceso a la empresa solicitada.');
    }

    let activeCompanyId = requestedCompanyId ?? user.primaryCompanyId ?? null;
    if (!activeCompanyId && memberships.length > 0) {
      activeCompanyId = memberships.find(membership => membership.isDefault)?.companyId ?? memberships[0].companyId;
    }
    if (activeCompanyId && !companyIds.includes(activeCompanyId)) {
      activeCompanyId = companyIds[0] ?? null;
    }

    const roleAssignments = this.getRoleAssignments(user);
    const moduleMap = this.deriveModuleAccess(tenant.modules, roleAssignments);
    const tenantModules = moduleMap.tenant.enabled;
    const modules = moduleMap.user.enabled;
    const restrictedModules = moduleMap.user.restricted;

    const companies = tenant.companies
      .filter(company => companyIds.includes(company.id) && company.status !== CompanyStatus.ARCHIVED)
      .map(company => ({
        id: company.id,
        name: company.name,
        status: company.status,
        isDefault: memberships.some(membership => membership.companyId === company.id && membership.isDefault),
      }));

    const { payload, userDetails } = this.createJwtPayload(user, {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      modules,
      tenantModules,
      restrictedModules,
      companyId: activeCompanyId,
      companyIds,
    });

    return {
      user,
      userId: user.id,
      tenant,
      modules,
      tenantModules,
      companies,
      companyId: activeCompanyId,
      payload,
      userDetails,
      moduleMap,
    };
  }

  private createJwtPayload(
    user: Omit<UserWithRelations, 'password'>,
    context: {
      tenantId: number;
      tenantSlug: string;
      modules: ModuleKey[];
      tenantModules: ModuleKey[];
      restrictedModules: ModuleKey[];
      companyId: number | null;
      companyIds: number[];
    },
  ): { payload: JwtPayload; userDetails: AuthUserDetails } {
    const { areas, roles, permissions, rolesByArea, isAdmin } = this.extractRoleData(user);

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: context.tenantId,
      tenantSlug: context.tenantSlug,
      companyId: context.companyId ?? null,
      companyIds: context.companyIds,
      modules: context.modules,
      tenantModules: context.tenantModules,
      restrictedModules: context.restrictedModules,
      email: user.email,
      username: user.username,
      areas,
      roles,
      permissions,
      rolesByArea,
      isAdmin,
      mustChangePassword: user.mustChangePassword,
      active: user.active,
    };

    const userDetails: AuthUserDetails = {
      id: user.id,
      username: user.username,
      email: user.email,
      areas,
      roles,
      rolesByArea,
      isAdmin,
      mustChangePassword: user.mustChangePassword,
      active: user.active,
      tenantId: context.tenantId,
      tenantSlug: context.tenantSlug,
      companyId: context.companyId ?? null,
      companyIds: context.companyIds,
      modules: context.modules,
      tenantModules: context.tenantModules,
      restrictedModules: context.restrictedModules,
    };

    return { payload, userDetails };
  }

  private deriveModuleAccess(
    tenantModules: TenantWithRelations['modules'],
    assignments: RoleAssignment[],
  ): ModuleAccessSnapshot {
    const buckets = this.buildModuleStatusBuckets(tenantModules);
    const { permissions, areas, isAdmin } = this.extractAssignmentAccessContext(assignments);

    const tenantEnabled = [...buckets.enabled];
    const userEnabledSet = new Set<ModuleKey>();
    const userEnabled = tenantEnabled.filter(moduleKey => {
      const allowed = this.isModuleEnabledForUser(moduleKey, permissions, areas, isAdmin);
      if (allowed) {
        userEnabledSet.add(moduleKey);
      }
      return allowed;
    });

    const restricted = tenantEnabled.filter(moduleKey => !userEnabledSet.has(moduleKey));

    return {
      tenant: buckets,
      user: {
        enabled: userEnabled,
        restricted,
      },
    };
  }

  private buildModuleStatusBuckets(tenantModules: TenantWithRelations['modules']): ModuleStatusBuckets {
    const buckets: ModuleStatusBuckets = {
      active: [],
      trial: [],
      inactive: [],
      pending: [],
      enabled: [],
      disabled: [],
    };

    for (const tenantModule of tenantModules) {
      const { module, status } = tenantModule;
      switch (status) {
        case ModuleStatus.ACTIVE:
          buckets.active.push(module);
          buckets.enabled.push(module);
          break;
        case ModuleStatus.TRIAL:
          buckets.trial.push(module);
          buckets.enabled.push(module);
          break;
        case ModuleStatus.INACTIVE:
          buckets.inactive.push(module);
          buckets.disabled.push(module);
          break;
        case ModuleStatus.PENDING:
          buckets.pending.push(module);
          buckets.disabled.push(module);
          break;
        default:
          break;
      }
    }

    return buckets;
  }

  private extractAssignmentAccessContext(assignments: RoleAssignment[]): {
    permissions: Set<Permission>;
    areas: Set<Area>;
    isAdmin: boolean;
  } {
    const permissions = new Set<Permission>();
    const areas = new Set<Area>();
    let isAdmin = false;

    for (const assignment of assignments) {
      if (!assignment || assignment.isActive === false) {
        continue;
      }

      areas.add(assignment.area);
      const assignmentPermissions = assignment.permissions ?? [];
      for (const permission of assignmentPermissions) {
        permissions.add(permission);
      }

      if (assignment.role === Role.Admin) {
        isAdmin = true;
      }
    }

    return { permissions, areas, isAdmin };
  }

  private isModuleEnabledForUser(
    moduleKey: ModuleKey,
    permissions: Set<Permission>,
    areas: Set<Area>,
    isAdmin: boolean,
  ): boolean {
    if (isAdmin) {
      return true;
    }

    const rule = MODULE_ACCESS_RULES[moduleKey];
    if (!rule) {
      return false;
    }

    if (rule.always) {
      return true;
    }

    if (rule.anyPermissions?.some(permission => permissions.has(permission))) {
      return true;
    }

    if (rule.areas?.some(area => areas.has(area))) {
      return true;
    }

    return false;
  }

  private extractRoleData(user: Omit<UserWithRelations, 'password'>) {
    const assignments = this.getRoleAssignments(user);
    const activeAssignments = assignments.filter(assignment => assignment.isActive);
    const areas = Array.from(new Set(activeAssignments.map(assignment => assignment.area)));
    const roles = Array.from(new Set(activeAssignments.map(assignment => assignment.role)));
    const permissions = Array.from(new Set(activeAssignments.flatMap(assignment => assignment.permissions)));

    const rolesByArea = activeAssignments.reduce<RolesByArea>((acc, assignment) => {
      acc[assignment.area] = {
        role: assignment.role,
        specialty: assignment.specialty,
        permissions: assignment.permissions,
        isActive: assignment.isActive,
      };
      return acc;
    }, {});

    const isAdmin = roles.includes(Role.Admin);

    return { areas, roles, permissions, rolesByArea, isAdmin };
  }

  private getRoleAssignments(source: Pick<UserWithRelations, 'roleAssignments'>): RoleAssignment[] {
    return Array.isArray(source.roleAssignments) ? [...source.roleAssignments] : [];
  }

  private getCompanyMemberships(source: Pick<UserWithRelations, 'userCompanies'>): UserCompanyMembership[] {
    return Array.isArray(source.userCompanies) ? [...source.userCompanies] : [];
  }

  private stripPassword<T extends { password?: string | null }>(user: T): Omit<T, 'password'> {
    const { password, ...rest } = user;
    return rest;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    return this.usersService.changePassword(userId, currentPassword, newPassword);
  }

  async regenerateTempPassword(userId: number) {
    return this.usersService.regenerateTempPassword(userId);
  }

  async isSupervisor(userId: number): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) return false;

    const assignments = this.getRoleAssignments(user as unknown as UserWithRelations);
    return assignments.some(assignment => assignment.role === Role.Supervisor && assignment.isActive);
  }

  async isJefe(userId: number): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) return false;

    const assignments = this.getRoleAssignments(user as unknown as UserWithRelations);
    return assignments.some(assignment => assignment.role === Role.Jefe && assignment.isActive);
  }

  async getAreasByRole(userId: number, role: string): Promise<string[]> {
    const user = await this.usersService.findById(userId);
    if (!user) return [];

    const assignments = this.getRoleAssignments(user as unknown as UserWithRelations);
    const normalizedRole = role as Role;

    return assignments
      .filter(assignment => assignment.role === normalizedRole && assignment.isActive)
      .map(assignment => assignment.area);
  }

  async canAccessArea(userId: number, area: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) return false;

    const assignments = this.getRoleAssignments(user as unknown as UserWithRelations);

    if (assignments.some(assignment => assignment.role === Role.Admin && assignment.isActive)) {
      return true;
    }

    return assignments.some(assignment => assignment.area === area && assignment.isActive);
  }

  async getHighestRoleInArea(userId: number, area: string): Promise<Role | null> {
    const user = await this.usersService.findById(userId);
    if (!user) return null;

    const assignments = this.getRoleAssignments(user as unknown as UserWithRelations);

    const roleHierarchy: Role[] = [
      Role.Admin,
      Role.Jefe,
      Role.Supervisor,
      Role.Especialista,
      Role.Trabajador,
      Role.Lector,
    ];

    const userRolesInArea = new Set(
      assignments
        .filter(assignment => assignment.area === area && assignment.isActive)
        .map(assignment => assignment.role),
    );

    for (const candidate of roleHierarchy) {
      if (userRolesInArea.has(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}
