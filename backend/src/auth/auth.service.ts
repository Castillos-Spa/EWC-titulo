import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtPayload, RolesByArea } from './interfaces/jwt-payload.interface';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  // Segun passport en nestJS
  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<Prisma.UserGetPayload<{ include: { roleAssignments: true } }>, 'password'> | null> {
    const user = await this.usersService.findByEmail(email); // This already includes roleAssignments
    if (!user) {
      return null;
    }

    // Compara la contraseña usando bcrypt - CORREGIDO
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (isPasswordValid) {
      // Usar desestructuración para excluir la propiedad password
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Omit<Prisma.UserGetPayload<{ include: { roleAssignments: true } }>, 'password'>) {
    const { payload, userDetails } = this.createJwtPayload(user);
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });

    // Use HMAC-SHA256 to hash refresh tokens (faster than bcrypt for this use-case)
    const refreshTokenHash = crypto
      .createHmac('sha256', process.env.REFRESH_TOKEN_SECRET || '')
      .update(refresh_token)
      .digest('hex');

    await this.usersService.setRefreshToken(user.id, refreshTokenHash);
    await this.usersService.updateLastLogin(user.id);

    return {
      access_token,
      refresh_token,
      user: userDetails,
    };
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshToken(userId, null);
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.register(registerDto);
    return user;
  }

  async refreshToken(token: string) {
    try {
      const refreshTokenPayload = this.jwtService.verify(token);
      const user = await this.usersService.findById(refreshTokenPayload.sub);

      if (!user || !user.active || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      // Verify HMAC-SHA256 hash of incoming token matches stored hash
      const incomingHash = crypto
        .createHmac('sha256', process.env.REFRESH_TOKEN_SECRET || '')
        .update(token)
        .digest('hex');

      if (incomingHash !== user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      const { payload, userDetails } = this.createJwtPayload(user);
      const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

      return {
        access_token: newAccessToken,
        user: userDetails,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private createJwtPayload(user: Omit<Prisma.UserGetPayload<{ include: { roleAssignments: true } }>, 'password'>) {
    const roleAssignments = user.roleAssignments || [];

    const activeAssignments = roleAssignments.filter(a => a.isActive);

    const areas = [...new Set(activeAssignments.map(r => r.area))];
    const roles = [...new Set(activeAssignments.map(r => r.role))];
    const allPermissions = [...new Set(activeAssignments.flatMap(r => r.permissions))];

    const rolesByArea = activeAssignments.reduce<RolesByArea>((acc, assignment) => {
      acc[assignment.area] = {
        role: assignment.role,
        specialty: assignment.specialty,
        permissions: assignment.permissions,
        isActive: assignment.isActive,
      };
      return acc;
    }, {});

    const isAdmin = roles.includes('Admin');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      areas,
      roles,
      permissions: allPermissions,
      rolesByArea,
      isAdmin,
      mustChangePassword: user.mustChangePassword,
      active: user.active,
    };

    const userDetails = {
      id: user.id,
      username: user.username,
      email: user.email,
      areas,
      roles,
      rolesByArea,
      isAdmin,
      mustChangePassword: user.mustChangePassword,
      active: user.active,
    };

    return { payload, userDetails };
  }

  // 🆕 Cambiar contraseña
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    return await this.usersService.changePassword(userId, currentPassword, newPassword);
  }

  // 🆕 Regenerar contraseña temporal
  async regenerateTempPassword(userId: number) {
    return await this.usersService.regenerateTempPassword(userId);
  }

  // 🆕 Verificar si el usuario es supervisor de al menos un área
  async isSupervisor(userId: number): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) return false;

    return user.roleAssignments?.some(assignment => assignment.role === 'Supervisor' && assignment.isActive) || false;
  }

  // 🆕 Verificar si el usuario es jefe de al menos un área
  async isJefe(userId: number): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) return false;
    return user.roleAssignments?.some(assignment => assignment.role === 'Jefe' && assignment.isActive) || false;
  }

  // 🆕 Obtener áreas donde el usuario tiene un rol específico
  async getAreasByRole(userId: number, role: string): Promise<string[]> {
    const user = await this.usersService.findById(userId);
    if (!user) return [];

    return (
      user.roleAssignments
        ?.filter(assignment => assignment.role === role && assignment.isActive)
        ?.map(assignment => assignment.area) || []
    );
  }

  // 🆕 Validar si el usuario puede acceder a un área específica
  async canAccessArea(userId: number, area: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) return false;

    if (user.roleAssignments?.some(a => a.role === 'Admin' && a.isActive)) {
      return true;
    }

    // Verificar si tiene algún rol en esa área
    return user.roleAssignments?.some(assignment => assignment.area === area && assignment.isActive) || false;
  }

  // 🆕 Obtener el rol más alto del usuario en un área específica
  async getHighestRoleInArea(userId: number, area: string): Promise<Role | null> {
    const user = await this.usersService.findById(userId);
    if (!user) return null;

    const roleHierarchy = ['Admin', 'Jefe', 'Supervisor', 'Especialista', 'Trabajador', 'Lector'];

    const userRolesInArea =
      user.roleAssignments
        ?.filter(assignment => assignment.area === area && assignment.isActive)
        ?.map(assignment => assignment.role) || [];

    for (const role of roleHierarchy) {
      if (userRolesInArea.includes(role as Role)) {
        return role as Role;
      }
    }

    return null;
  }
}
