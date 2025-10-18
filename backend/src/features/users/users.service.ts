import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CacheService } from '@/common/cache.service';
import { User, Role, Permission, Prisma, Specialty } from '@prisma/client';
import { RegisterDto } from '@/features/auth/dtos/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { NotificacionService } from '../notificacion/notificacion.service';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

@Injectable()
export class UsersService {
  constructor(
    // Inyectar `forwardRef` para romper dependencias circulares si es necesario
    // @Inject(forwardRef(() => NotificacionService))
    private readonly notificationService: NotificacionService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  private readonly userInclude = {
    roleAssignments: true,
  } satisfies Prisma.UserInclude;

  private async findUser(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ where, include: { roleAssignments: true } });
  }

  async findOne(username: string): Promise<Prisma.UserGetPayload<{ include: { roleAssignments: true } }> | null> {
    return this.prisma.user.findFirst({
      where: { username },
      include: this.userInclude,
    });
  }

  async findByEmail(email: string): Promise<Prisma.UserGetPayload<{ include: { roleAssignments: true } }> | null> {
    return this.findUser({ email });
  }

  async findById(id: number): Promise<Prisma.UserGetPayload<{ include: { roleAssignments: true } }> | null> {
    return this.findUser({ id });
  }

  generateTempPassword(length = 10) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  async register(registerDto: RegisterDto): Promise<{
    user: Omit<Prisma.UserGetPayload<{ include: { roleAssignments: true } }>, 'password'>;
    tempPassword?: string;
  }> {
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

    const { roleAssignments, ...userData } = registerDto;

    const newUser = await this.prisma.$transaction(async prisma => {
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          mustChangePassword,
          active: userData.active ?? true,
        },
      });

      if (roleAssignments && roleAssignments.length > 0) {
        await prisma.userRoleAssignment.createMany({
          data: roleAssignments.map(assignment => ({
            userId: user.id,
            area: assignment.area,
            role: Role[assignment.role as keyof typeof Role],
            specialty: assignment.specialty ? assignment.specialty : null,
            permissions: (assignment.additionalPermissions || []).filter(Boolean) as Permission[],
          })),
        });
      }

      return user;
    });

    const userWithRoles = await this.findById(newUser.id);
    if (!userWithRoles) {
      throw new NotFoundException('No se pudo crear el usuario.');
    }
    const { password: _, ...result } = userWithRoles;

    // Notificar a todos los usuarios del área 'Admin' sobre la creación del nuevo usuario.
    let message = `El usuario ${result.username} fue creado exitosamente.`;
    // La contraseña temporal solo se debe mostrar al admin que lo creó, no a todos.
    // El modal que aparece en el frontend después de crear ya cumple esta función.

    await this.notificationService.createNotification({
      title: 'Nuevo Usuario Creado',
      message,
      roles: ['Admin'], // 🎯 Usamos 'role' para que coincida con el DTO de notificación
      type: 'user_created',
      createdById: result.id, // El ID del usuario que se acaba de crear
    });

    // Invalidar cache de total y listados de usuarios
    this.cacheService.del('users_total');
    this.cacheService.delPrefix('cache:GET:/users');

    return { user: result, tempPassword };
  }

  async updateUser(
    id: number,
    data: Partial<RegisterDto>,
  ): Promise<Prisma.UserGetPayload<{ include: { roleAssignments: true } }>> {
    const { roleAssignments, ...userData } = data;

    return this.prisma.$transaction(async prisma => {
      const userExists = await prisma.user.findUnique({ where: { id } });
      if (!userExists) throw new NotFoundException('Usuario no encontrado');

      const updateData: any = { ...userData };
      if (userData.password) {
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      await prisma.user.update({
        where: { id },
        data: updateData,
      });

      if (roleAssignments) {
        // Primero borramos las asignaciones existentes para este usuario
        await prisma.userRoleAssignment.deleteMany({ where: { userId: id } });

        // Luego creamos las nuevas asignaciones
        await prisma.userRoleAssignment.createMany({
          data: roleAssignments.map(assignment => ({
            userId: id,
            area: assignment.area,
            role: Role[assignment.role as keyof typeof Role],
            specialty: assignment.specialty ? assignment.specialty : null,
            permissions: (assignment.additionalPermissions || []).filter(Boolean) as Permission[],
          })),
        });
      }

      const finalUser = await this.findById(id);
      if (!finalUser) {
        throw new NotFoundException('No se pudo encontrar el usuario actualizado.');
      }
      return finalUser;
    });
  }

  async findAll(query: PaginationQueryDto & { specialty?: Specialty }) {
    const { page = 1, pageSize = 10, specialty } = query;
    const skip = (page - 1) * pageSize;

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
        take: pageSize,
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
      const ra = user.roleAssignments;
      // Build derived fields expected by frontend
      const rolesArr: string[] = Array.from(new Set((ra || []).map((r: any) => r.role).filter(Boolean)));
      const areasArr: string[] = Array.from(new Set((ra || []).map((r: any) => r.area).filter(Boolean)));
      const rolesByArea: Record<string, { role: string; specialty?: string | null; permissions: string[] }> = {};
      (ra || []).forEach((r: any) => {
        if (!r?.area) return;
        rolesByArea[r.area] = {
          role: r.role,
          specialty: r.specialty ?? null,
          permissions: Array.isArray(r.additionalPermissions) ? r.additionalPermissions : [],
        };
      });

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
      } as unknown as Omit<User, 'password'>;
    });

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
