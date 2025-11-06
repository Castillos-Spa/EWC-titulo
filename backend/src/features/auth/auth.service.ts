import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dtos/register.dto';
import { JwtPayload, RolesByArea } from './interfaces/jwt-payload.interface';
import { PrismaService } from 'prisma/prisma.service';
import { CompanyStatus, ModuleKey, ModuleStatus, Prisma, Role, TenantStatus } from '@prisma/client';

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
}

export interface AuthSession {
  userId: number;
  user: Omit<UserWithRelations, 'password'>;
  tenant: TenantWithRelations;
  modules: ModuleKey[];
  companies: Array<{ id: number; name: string; status: CompanyStatus; isDefault: boolean }>;
  companyId: number | null;
  payload: JwtPayload;
  userDetails: AuthUserDetails;
}

interface RefreshTokenPayload {
  sub: number;
  email: string;
  tenantId?: number;
  companyId?: number | null;
}

type RoleAssignment = NonNullable<UserWithRelations['roleAssignments']>[number];
type UserCompanyMembership = NonNullable<UserWithRelations['userCompanies']>[number];

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
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
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

    const modules = tenant.modules
      .filter(module => module.status === ModuleStatus.ACTIVE || module.status === ModuleStatus.TRIAL)
      .map(module => module.module);

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
      companyId: activeCompanyId,
      companyIds,
    });

    return {
      user,
      userId: user.id,
      tenant,
      modules,
      companies,
      companyId: activeCompanyId,
      payload,
      userDetails,
    };
  }

  private createJwtPayload(
    user: Omit<UserWithRelations, 'password'>,
    context: {
      tenantId: number;
      tenantSlug: string;
      modules: ModuleKey[];
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
    };

    return { payload, userDetails };
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
