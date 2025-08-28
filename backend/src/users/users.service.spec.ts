import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { Role, Permission, User } from '@prisma/client';

// Mocks
jest.mock('bcrypt');
jest.mock('../../prisma/prisma.service');

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: PrismaService;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    area: 'Administración',
    password: 'hashedPassword',
    roles: [Role.User],
    permissions: [Permission.VIEW_DASHBOARD],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    area: 'Administración',
    roles: [Role.User],
    permissions: [Permission.VIEW_DASHBOARD],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('debería retornar un usuario por username', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      const result = await usersService.findOne('testuser');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('debería retornar null si el usuario no existe', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      const result = await usersService.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('debería retornar un usuario por email', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('debería retornar null si el usuario no existe', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await usersService.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('debería retornar un usuario por ID', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await usersService.findById(1);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('debería retornar null si el usuario no existe', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await usersService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('debería crear un nuevo usuario con contraseña hasheada', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        area: 'Administración',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);

      const result = await usersService.register(registerDto);

      expect(result).toEqual(mockUserWithoutPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          area: 'Administración',
          password: 'hashedPassword',
          roles: [Role.User],
          permissions: [Permission.VIEW_DASHBOARD],
        },
      });
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los usuarios sin contraseñas', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([mockUserWithoutPassword] as any);

      const result = await usersService.findAll();

      expect(result).toEqual([mockUserWithoutPassword]);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('updateUserRoles', () => {
    it('debería actualizar los roles de un usuario', async () => {
      const updatedUser = {
        ...mockUser,
        roles: [Role.Admin, Role.User],
      };

      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await usersService.updateUserRoles(1, [Role.Admin, Role.User]);

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { roles: [Role.Admin, Role.User] },
      });
    });
  });

  describe('updateUserPermissions', () => {
    it('debería actualizar los permisos de un usuario', async () => {
      const updatedUser = {
        ...mockUser,
        permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_ROUTES],
      };

      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await usersService.updateUserPermissions(1, [Permission.VIEW_DASHBOARD, Permission.VIEW_ROUTES]);

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_ROUTES],
        },
      });
    });
  });
});
