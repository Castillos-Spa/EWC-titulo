import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role, Permission } from '@prisma/client';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { NotificacionService } from '@/notificacion/notificacion.service';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  //TODO definir permisos para cada rol
  Admin: Object.values(Permission),
  IT: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.MANAGE_TICKETS],
  // Otros roles...
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificacionService,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { username },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
  async deleteUser(id: number): Promise<{ success: boolean }> {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  generateTempPassword(length = 10) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }
  async updateUser(id: number, data: Partial<RegisterDto>): Promise<User> {
    // Si se incluye password, hashearla
    let updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    // Si roles o permissions vienen como string, convertir a enum
    if (data.roles) {
      const rolesEnum = (data.roles as any[])
        .map(r => (typeof r === 'string' ? Role[r as keyof typeof Role] : r))
        .filter(Boolean);
      updateData.roles = rolesEnum;

      // Si se actualizan los roles, recalcular los permisos basados en ellos,
      // a menos que los permisos se pasen explícitamente en la misma solicitud.
      if (!data.permissions) {
        const permissions = new Set<Permission>();
        rolesEnum.forEach(role => {
          const rolePermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
          if (rolePermissions) {
            rolePermissions.forEach(p => permissions.add(p));
          }
        });
        updateData.permissions = Array.from(permissions);
      }
    }
    if (data.permissions) {
      updateData.permissions = (data.permissions as any[])
        .map(p => (typeof p === 'string' ? Permission[p as keyof typeof Permission] : p))
        .filter(Boolean);
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async register(registerDto: RegisterDto): Promise<{ user: Omit<User, 'password'>; tempPassword?: string }> {
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

    // Convierte los strings a enums y filtra valores inválidos
    const rolesEnum = (registerDto.roles ?? []).map(r => Role[r as keyof typeof Role]).filter(Boolean);
    let permissionsEnum = (registerDto.permissions ?? [])
      .map(p => Permission[p as keyof typeof Permission])
      .filter(Boolean);

    // Si el usuario tiene un rol definido en ROLE_PERMISSIONS, asigna esos permisos
    for (const role of rolesEnum) {
      if (ROLE_PERMISSIONS[role]) {
        permissionsEnum = ROLE_PERMISSIONS[role];
        break; // Si quieres que solo tome el primer rol, o ajusta para combinar permisos de varios roles
      }
    }

    const newUser = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        area: registerDto.area || 'default',
        password: hashedPassword,
        mustChangePassword,
        roles: rolesEnum.length > 0 ? rolesEnum : [Role.User],
        permissions: permissionsEnum.length > 0 ? permissionsEnum : [Permission.VIEW_DASHBOARD],
      },
    });

    // Excluir la password del resultado
    const { password: _, ...result } = newUser;

    // 🚨 Emitir notificación
    await this.notificationService.createNotification({
      title: 'Nuevo usuario creado',
      message: `El usuario ${result.username} fue creado exitosamente`,
      type: 'user_created',
      createdById: result.id, // el que ejecutó la acción
      // puedes decidir aquí a quién va:
      role: 'Admin', // todos los admins
      // userId: result.id, // si quieres que solo lo vea el mismo user creado
      // area: result.area, // si quieres que lo vean todos los del área
    });

    return { user: result, tempPassword };
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        area: true,
        roles: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        active: true,
        lastLogin: true,
        mustChangePassword: true,
        refreshToken: true, // Añadir este campo para que coincida con el tipo de retorno
      },
    });
    return users;
  }

  async updateUserRoles(userId: number, roles: Role[]): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roles },
    });
  }

  async updateUserPermissions(userId: number, permissions: Permission[]): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { permissions },
    });
  }

  // Cambiar password y quitar flag de cambio obligatorio
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
        mustChangePassword: false, // Ya no requiere cambio
      },
      select: {
        id: true,
        email: true,
        username: true,
        mustChangePassword: true,
        active: true,
        roles: true,
        area: true,
        // ...otros campos que quieras retornar
      },
    });
  }

  // Regenerar password temporal y poner flag de cambio obligatorio
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
    return { tempPassword }; // Devuelve la nueva password temporal
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
