import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role, Permission } from '@prisma/client';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const defaultRoles: Role[] = [Role.User];
    const defaultPermissions: Permission[] = [Permission.VIEW_DASHBOARD];

    const newUser = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        area: registerDto.area || 'default',
        password: hashedPassword,

        roles: defaultRoles,
        permissions: defaultPermissions,
      },
    });

    // Excluir la password del resultado
    const { password, ...result } = newUser;
    return result;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        area: true,
        roles: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
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
}
