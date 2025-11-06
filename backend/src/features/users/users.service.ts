import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CacheService } from '@/common/cache.service';
import { User, Role, Permission, Prisma, Specialty, Area } from '@prisma/client';
import { RegisterDto } from '@/features/auth/dtos/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { NotificationService } from '../notification/notification.service';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { toPrismaPagination } from '@/common/utils/pagination.util';
import { TenantContextService } from '@/app/core/tenant-context.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private readonly userInclude: Prisma.UserInclude = {
    roleAssignments: true,
    userCompanies: true,
    tenant: true,
    _count: {
      select: {
        notifications: true,
        userCompanies: true,
      },
    },
  } as Prisma.UserInclude;

  private async findUser(where: Prisma.UserWhereInput) {
    return this.prisma.user.findFirst({ where, include: this.userInclude });
  }

  private sanitizeUser<T extends { password?: string }>(user: T | null): Omit<T, 'password'> | null {
    if (!user) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  private resolveTenantId(tenantId?: number): number {
    const resolved = tenantId ?? this.tenantContext.tenantId;
    if (!resolved) {
      throw new UnauthorizedException('Tenant no especificado en la operación.');
    }
    return resolved;
  }

  async findOne(username: string, tenantId?: number) {
    const resolvedTenantId = this.resolveTenantId(tenantId);
    return this.findUser({ username, tenantId: resolvedTenantId });
  }

  async findByEmail(email: string, tenantId?: number) {
    const resolvedTenantId = this.resolveTenantId(tenantId);
    return this.findUser({ email, tenantId: resolvedTenantId });
  }

  async findById(id: number, tenantId?: number) {
    const where: Prisma.UserWhereInput = { id };
    const resolvedTenantId = tenantId ?? this.tenantContext.tenantId;
    if (resolvedTenantId) {
      where.tenantId = resolvedTenantId;
    }
    return this.findUser(where);
  }

  generateTempPassword(length = 10) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  async register(registerDto: RegisterDto) {
    const tenantId = this.resolveTenantId();

    let password = registerDto.password;
    let tempPassword: string | undefined;
    let mustChangePassword = false;

    if (!password || password.length < 6) {
      tempPassword = this.generateTempPassword(10);
      password = tempPassword;
      mustChangePassword = true;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { roleAssignments, companyIds = [], primaryCompanyId, ...userData } = registerDto;

    const requestedCompanyIds = Array.from(new Set(companyIds.filter(id => Number.isInteger(id))));
    if (primaryCompanyId && !requestedCompanyIds.includes(primaryCompanyId)) {
      requestedCompanyIds.push(primaryCompanyId);
    }

    let resolvedPrimaryCompanyId = primaryCompanyId ?? null;
    if (requestedCompanyIds.length > 0) {
      const validCompanies = await this.prisma.company.findMany({
        where: {
          tenantId,
          id: { in: requestedCompanyIds },
        },
        select: { id: true },
      });

      const validIds = new Set(validCompanies.map(company => company.id));
      const missing = requestedCompanyIds.filter(id => !validIds.has(id));
      if (missing.length > 0) {
        throw new NotFoundException('Una o más empresas no pertenecen al tenant actual.');
      }

      if (!resolvedPrimaryCompanyId && validCompanies.length > 0) {
        resolvedPrimaryCompanyId = validCompanies[0]?.id ?? null;
      }
    }

    const newUser = await this.prisma.$transaction(async prisma => {
      const user = await prisma.user.create({
        data: {
          tenantId,
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          mustChangePassword,
          active: userData.active ?? true,
          primaryCompanyId: resolvedPrimaryCompanyId,
        },
      });

      if (requestedCompanyIds.length > 0) {
        await prisma.userCompany.createMany({
          data: requestedCompanyIds.map(companyIdValue => ({
            tenantId,
            userId: user.id,
            companyId: companyIdValue,
            isDefault: resolvedPrimaryCompanyId
              ? companyIdValue === resolvedPrimaryCompanyId
              : companyIdValue === requestedCompanyIds[0],
          })),
          skipDuplicates: true,
        });
      }

      if (roleAssignments && roleAssignments.length > 0) {
        await prisma.userRoleAssignment.createMany({
          data: roleAssignments.map(assignment => {
            if (assignment.companyId && !requestedCompanyIds.includes(assignment.companyId)) {
              throw new BadRequestException(
                'La asignación de rol hace referencia a una empresa no asignada al usuario.',
              );
            }

            return {
              tenantId,
              userId: user.id,
              area: assignment.area as Area,
              role: Role[assignment.role as keyof typeof Role],
              specialty: assignment.specialty ? assignment.specialty : null,
              permissions: (assignment.additionalPermissions || []).filter(Boolean) as Permission[],
              companyId: assignment.companyId ?? resolvedPrimaryCompanyId ?? null,
            };
          }),
        });
      }

      return user;
    });

    const userWithRelations = await this.findById(newUser.id, tenantId);
    if (!userWithRelations) {
      throw new NotFoundException('No se pudo crear el usuario.');
    }
    const result = this.sanitizeUser(userWithRelations);
    if (!result) {
      throw new NotFoundException('No se pudo crear el usuario.');
    }

    const username = (result as any).username ?? registerDto.username;
    const userId = (result as any).id ?? newUser.id;

    const message = `El usuario ${username} fue creado exitosamente.`;

    await this.notificationService.createNotification({
      title: 'Nuevo Usuario Creado',
      message,
      roles: ['Admin'],
      type: 'user_created',
      createdById: userId,
    });

    this.cacheService.del('users_total');
    this.cacheService.delPrefix('cache:GET:/users');

    return { user: result, tempPassword };
  }

  async updateUser(id: number, data: UpdateUserDto) {
    const { roleAssignments, ...userData } = data;
    const tenantId = this.resolveTenantId();

    return this.prisma.$transaction(async prisma => {
      const userExists = await prisma.user.findUnique({ where: { id } });
      if (!userExists) throw new NotFoundException('Usuario no encontrado');

      await prisma.user.update({
        where: { id },
        data: userData,
      });

      if (roleAssignments) {
        // Primero borramos las asignaciones existentes para este usuario
        await prisma.userRoleAssignment.deleteMany({ where: { userId: id } });

        // Luego creamos las nuevas asignaciones
        await prisma.userRoleAssignment.createMany({
          data: roleAssignments.map(assignment => ({
            tenantId,
            userId: id,
            area: assignment.area as Area,
            role: Role[assignment.role as keyof typeof Role],
            specialty: assignment.specialty ? assignment.specialty : null,
            permissions: (assignment.additionalPermissions || []).filter(Boolean) as Permission[],
            companyId: (assignment as any).companyId ?? null,
          })),
        });
      }

      const finalUser = await this.findById(id);
      if (!finalUser) {
        throw new NotFoundException('No se pudo encontrar el usuario actualizado.');
      }
      return this.sanitizeUser(finalUser);
    });
  }

  async findAll(query: PaginationQueryDto & { specialty?: Specialty }) {
    const { specialty } = query;
    const { skip, take } = toPrismaPagination(query);

    const where: Prisma.UserWhereInput = {};
    if (specialty) {
      where.roleAssignments = {
        some: {
          specialty,
        },
      };
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          active: true,
          lastLogin: true,
          roleAssignments: {
            where: { isActive: true },
            select: {
              id: true,
              area: true,
              role: true,
              specialty: true,
              permissions: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Procesamos los resultados para añadir los campos derivados que espera el frontend
    const items = users.map(user => {
      const castUser = user as any;
      const ra = castUser.roleAssignments ?? [];
      const primaryCompanyId = null;
      // Build derived fields expected by frontend
      const rolesArr: string[] = Array.from(new Set((ra || []).map((r: any) => r.role).filter(Boolean)));
      const areasArr: string[] = Array.from(new Set((ra || []).map((r: any) => r.area).filter(Boolean)));
      const rolesByArea: Record<string, { role: string; specialty?: string | null; permissions: string[] }> = {};
      for (const r of ra || []) {
        if (!r?.area) continue;
        let permissions: string[] = [];
        if (Array.isArray(r.additionalPermissions)) {
          permissions = r.additionalPermissions;
        } else if (Array.isArray(r.permissions)) {
          permissions = r.permissions;
        }

        rolesByArea[r.area] = {
          role: r.role,
          specialty: r.specialty ?? null,
          permissions,
        };
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        active: user.active,
        lastLogin: user.lastLogin,
        roleAssignments: ra,
        roles: rolesArr,
        areas: areasArr,
        rolesByArea,
        isAdmin: rolesArr.includes('Admin'),
        primaryCompanyId,
        companyIds: [],
        defaultCompanyId: primaryCompanyId,
      } as unknown as Omit<User, 'password'>;
    });

    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 10, 1), 100);
    const totalPages = Math.ceil(total / pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  async deleteUser(id: number, requestingUserId: number): Promise<{ success: boolean }> {
    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes eliminar tu propio usuario.');
    }

    await this.prisma.$transaction(async prisma => {
      await prisma.notification.deleteMany({
        where: { createdById: id },
      });
      // UserRoleAssignment is deleted by onDelete: Cascade
      await prisma.user.delete({ where: { id } });
    });

    return { success: true };
  }

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: {
        password: hashed,
        mustChangePassword: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        mustChangePassword: true,
        active: true,
        roleAssignments: true,
      },
    });
  }

  async regenerateTempPassword(id: number) {
    const tempPassword = crypto.randomBytes(8).toString('base64').slice(0, 10);
    const hashed = await bcrypt.hash(tempPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashed,
        mustChangePassword: true,
      },
    });
    return { tempPassword };
  }

  async setRefreshToken(userId: number, refreshTokenHash: string | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: refreshTokenHash },
    });
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }
}
