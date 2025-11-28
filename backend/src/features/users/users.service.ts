import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StorageService } from '@/app/storage/storage.service';
import { MailService } from '@/app/mail/mail.service';
import { RolesByArea } from '../auth/interfaces/jwt-payload.interface';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Express } from 'express';

type UserWithRoles = Prisma.UserGetPayload<{ include: { roleAssignments: true } }>;

type PresentedUser = Omit<UserWithRoles, 'password'> & {
  roles: Role[];
  areas: Area[];
  permissions: Permission[];
  rolesByArea: RolesByArea;
  isAdmin: boolean;
  avatarUrl?: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly storage: StorageService,
  ) {}

  private readonly logger = new Logger(UsersService.name);

  private readonly userInclude = {
    roleAssignments: true,
  } satisfies Prisma.UserInclude;

  private readonly avatarAllowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ];

  private readonly avatarFolderPrefix = 'users';

  private readonly avatarMaxSizeBytes = 7 * 1024 * 1024;

  private readonly avatarFieldName = 'file';

  private readonly avatarMaxFiles = 1;

  private async findUser(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ where, include: this.userInclude });
  }

  private sanitizeUser<T extends { password?: string }>(user: T | null) {
    if (!user) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  private async resolveAvatarUrl(reference?: string | null): Promise<string | undefined> {
    if (!reference) {
      return undefined;
    }

    try {
      return await this.storage.getSignedUrl(reference);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`No se pudo firmar la URL del avatar (${reference}): ${err.message}`);
      return reference;
    }
  }

  private async presentUser(user: UserWithRoles | null): Promise<PresentedUser | null> {
    const sanitized = this.sanitizeUser(user) as Omit<UserWithRoles, 'password'> | null;
    if (!sanitized) {
      return null;
    }

    const avatarUrl = await this.resolveAvatarUrl(sanitized.avatarUrl);

    const roleAssignments = sanitized.roleAssignments ?? [];
    const activeAssignments = roleAssignments.filter(assignment => assignment?.isActive !== false);

    const areas = Array.from(new Set(activeAssignments.map(assignment => assignment.area).filter(Boolean)));
    const roles = Array.from(new Set(activeAssignments.map(assignment => assignment.role).filter(Boolean))); // Role enum already
    const permissions = Array.from(
      new Set(activeAssignments.flatMap(assignment => assignment.permissions ?? []).filter(Boolean)),
    ) as Permission[];

    const rolesByArea = activeAssignments.reduce<RolesByArea>((acc, assignment) => {
      if (!assignment?.area) {
        return acc;
      }
      acc[assignment.area] = {
        role: assignment.role,
        specialty: assignment.specialty ?? null,
        permissions: assignment.permissions ?? [],
        isActive: assignment.isActive ?? true,
      };
      return acc;
    }, {} as RolesByArea);

    const isAdmin = roles.includes(Role.Admin);

    return {
      ...sanitized,
      avatarUrl: avatarUrl ?? sanitized.avatarUrl ?? undefined,
      roles,
      areas,
      permissions,
      rolesByArea,
      isAdmin,
    } as PresentedUser;
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

  async findExistingEmails(emails: string[]): Promise<Set<string>> {
    const uniqueEmails = Array.from(
      new Set(emails.map(email => email?.toLowerCase().trim()).filter((email): email is string => Boolean(email))),
    );

    if (uniqueEmails.length === 0) {
      return new Set();
    }

    const matches = await this.prisma.user.findMany({
      where: {
        email: {
          in: uniqueEmails,
        },
      },
      select: {
        email: true,
      },
    });

    this.logger.log(
      `findExistingEmails requested=${uniqueEmails.length} matched=${matches.length} emails=${JSON.stringify(
        matches.map(match => match.email),
      )}`,
    );

    return new Set(matches.map(match => match.email.toLowerCase()));
  }

  async findById(id: number): Promise<Prisma.UserGetPayload<{ include: { roleAssignments: true } }> | null> {
    return this.findUser({ id });
  }

  generateTempPassword(length = 10) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  async register(registerDto: RegisterDto): Promise<{ user: PresentedUser; tempPassword?: string }> {
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
            area: assignment.area as Area,
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
    const result = await this.presentUser(userWithRoles);
    if (!result) {
      throw new NotFoundException('No se pudo crear el usuario.');
    }

    this.logger.log(`register created userId=${result.id} email=${result.email}`);

    // Notificar a todos los usuarios del área 'Admin' sobre la creación del nuevo usuario.
    const message = `El usuario ${result.username} fue creado exitosamente.`;
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

    // Enviar correo con contraseña temporal (si se generó) a destinatario de prueba o al correo del usuario
    if (tempPassword) {
      const to = process.env.MAIL_TO_OVERRIDE ?? result.email ?? undefined;
      if (to) {
        try {
          await this.mail.sendBukWelcomeEmail({
            to,
            employeeEmail: result.email ?? result.username,
            tempPassword,
          });
          this.logger.log(`Temp password email queued to ${to}`);
        } catch (err) {
          const e = err as Error;
          this.logger.warn(`No se pudo enviar el correo de bienvenida: ${e.message}`);
        }
      } else {
        this.logger.warn('No se envió correo: destinatario no definido (MAIL_TO_OVERRIDE o email de usuario ausente)');
      }
    }

    return { user: result, tempPassword };
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<PresentedUser> {
    const { roleAssignments, ...userData } = data;

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
            userId: id,
            area: assignment.area as Area,
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
      const presented = await this.presentUser(finalUser);
      if (!presented) {
        throw new NotFoundException('No se pudo presentar el usuario actualizado.');
      }
      return presented;
    });
  }

  async getProfile(userId: number): Promise<PresentedUser> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const presented = await this.presentUser(user);
    if (!presented) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return presented;
  }

  async updateProfile(
    targetUserId: number,
    dto: UpdateProfileDto,
    actor: { userId: number; roles: Role[] },
  ): Promise<PresentedUser> {
    const targetUser = await this.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isSelf = actor.userId === targetUserId;
    const isAdmin = actor.roles?.includes(Role.Admin) ?? false;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('No tienes permisos para actualizar este perfil.');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.username !== undefined) {
      const trimmed = dto.username.trim();
      if (!trimmed) {
        throw new BadRequestException('El nombre de usuario no puede estar vacío.');
      }
      data.username = trimmed;
    }

    if (dto.fullName !== undefined) {
      const trimmed = dto.fullName.trim();
      data.fullName = trimmed.length > 0 ? trimmed : null;
    }

    if (dto.email !== undefined) {
      const trimmed = dto.email.trim();
      if (!trimmed) {
        throw new BadRequestException('El correo electrónico no puede estar vacío.');
      }
      data.email = trimmed;
    }

    if (dto.phone !== undefined) {
      const trimmed = dto.phone.trim();
      data.phone = trimmed.length > 0 ? trimmed : null;
    }

    if (dto.address !== undefined) {
      const trimmed = dto.address.trim();
      data.address = trimmed.length > 0 ? trimmed : null;
    }

    if (dto.jobTitle !== undefined) {
      const trimmed = dto.jobTitle.trim();
      data.jobTitle = trimmed.length > 0 ? trimmed : null;
    }

    if (dto.bio !== undefined) {
      const trimmed = dto.bio.trim();
      data.bio = trimmed.length > 0 ? trimmed : null;
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: targetUserId },
        data,
        include: this.userInclude,
      });

      this.cacheService.del('users_total');
      this.cacheService.delPrefix('cache:GET:/users');
      this.cacheService.del('cache:GET:/auth/profile');

      const presented = await this.presentUser(updated);
      if (!presented) {
        throw new NotFoundException('No se pudo presentar el usuario actualizado.');
      }
      return presented;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        if (Array.isArray(error.meta?.target) && (error.meta?.target as string[]).includes('User_email_key')) {
          throw new BadRequestException('El correo electrónico ya está en uso por otro usuario.');
        }
        throw new BadRequestException('Los datos proporcionados ya están siendo utilizados por otro usuario.');
      }
      throw error;
    }
  }

  async updateAvatar(
    targetUserId: number,
    file: Express.Multer.File | undefined,
    actor: { userId: number; roles: Role[] },
  ): Promise<PresentedUser> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo para subir.');
    }

    if (file.size > this.avatarMaxSizeBytes) {
      throw new BadRequestException('El archivo excede el tamaño máximo permitido (7MB).');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId }, include: this.userInclude });
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isSelf = actor.userId === targetUserId;
    const isAdmin = actor.roles?.includes(Role.Admin) ?? false;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('No tienes permisos para actualizar el avatar de este usuario.');
    }

    const uploaded = await this.storage.uploadFile(file, {
      folder: `${this.avatarFolderPrefix}/${targetUserId}/avatar`,
      allowedMimeTypes: this.avatarAllowedMimeTypes,
    });

    const previousKey = targetUser.avatarUrl ? this.storage.getObjectKey(targetUser.avatarUrl) : null;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        avatarUrl: uploaded.url,
      },
      include: this.userInclude,
    });

    if (previousKey) {
      try {
        await this.storage.deleteObject(previousKey);
      } catch (error) {
        const err = error as Error;
        this.logger.warn(`No se pudo eliminar el avatar anterior (${previousKey}): ${err.message}`);
      }
    }

    this.cacheService.delPrefix('cache:GET:/users');
    this.cacheService.del('cache:GET:/auth/profile');

    const presented = await this.presentUser(updated);
    if (!presented) {
      throw new NotFoundException('No se pudo presentar el usuario actualizado.');
    }
    return presented;
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
          fullName: true,
          phone: true,
          address: true,
          jobTitle: true,
          bio: true,
          avatarUrl: true,
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
    const items = await Promise.all(
      users.map(async user => {
        const ra = user.roleAssignments;
        // Build derived fields expected by frontend
        const rolesArr: string[] = Array.from(new Set((ra || []).map((r: any) => r.role).filter(Boolean)));
        const areasArr: string[] = Array.from(new Set((ra || []).map((r: any) => r.area).filter(Boolean)));
        const rolesByArea: Record<string, { role: string; specialty?: string | null; permissions: string[] }> = {};
        for (const r of ra || []) {
          if (!r?.area) continue;
          let permissions: string[] = [];
          if (Array.isArray((r as any).additionalPermissions)) {
            permissions = (r as any).additionalPermissions as string[];
          } else if (Array.isArray(r.permissions)) {
            permissions = r.permissions as string[];
          }

          rolesByArea[r.area] = {
            role: r.role,
            specialty: r.specialty ?? null,
            permissions,
          };
        }

        const avatarUrl = await this.resolveAvatarUrl(user.avatarUrl);

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          active: user.active,
          lastLogin: user.lastLogin,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          jobTitle: user.jobTitle,
          bio: user.bio,
          avatarUrl: avatarUrl ?? user.avatarUrl ?? undefined,
          roleAssignments: ra,
          roles: rolesArr,
          areas: areasArr,
          rolesByArea,
          isAdmin: rolesArr.includes('Admin'),
        } as unknown as Omit<User, 'password'>;
      }),
    );

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

    const sanitizedNewPassword = newPassword?.trim();
    if (!sanitizedNewPassword || sanitizedNewPassword.length < 6) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const isSamePassword = await bcrypt.compare(sanitizedNewPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña debe ser distinta a la actual.');
    }

    const hashed = await bcrypt.hash(sanitizedNewPassword, 10);
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        password: hashed,
        mustChangePassword: false,
        refreshToken: null,
      },
      include: this.userInclude,
    });

    return this.presentUser(updatedUser);
  }

  async regenerateTempPassword(id: number) {
    const tempPassword = crypto.randomBytes(8).toString('base64').slice(0, 10);
    const hashed = await bcrypt.hash(tempPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashed,
        mustChangePassword: true,
        refreshToken: null,
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
