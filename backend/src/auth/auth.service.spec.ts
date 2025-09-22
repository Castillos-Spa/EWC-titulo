import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { Role, Permission } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

// Mock de las dependencias
jest.mock('bcrypt');
jest.mock('../users/users.service');
jest.mock('@nestjs/jwt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UsersService, JwtService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('debería retornar usuario sin password cuando las credenciales son válidas', async () => {
      const mockUser = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        area: ['Administración'],
        password: 'hashedPassword',
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        mustChangePassword: false,
        lastLogin: null,
        refreshToken: 'some-hashed-token',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('john@example.com', 'admin123');

      expect(result).toEqual({
        id: 1,
        username: 'john',
        email: 'john@example.com',
        area: ['Administración'],
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        active: true,
        mustChangePassword: false,
        lastLogin: null,
        refreshToken: 'some-hashed-token',
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('admin123', 'hashedPassword');
    });

    it('debería retornar null cuando el usuario no existe', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await authService.validateUser('notfound@example.com', 'password123');

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith('notfound@example.com');
    });

    it('debería retornar null cuando la contraseña es incorrecta', async () => {
      const mockUser = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        area: ['Administración'],
        password: 'hashedPassword',
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        mustChangePassword: false,
        lastLogin: null,
        refreshToken: 'some-hashed-token',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('john@example.com', 'wrongpassword');

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    });
  });

  describe('login', () => {
    it('debería retornar un access_token y refresh_token con el payload correcto', async () => {
      const mockUser = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        area: ['Administración'],
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        active: true,
        mustChangePassword: false,
      };

      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockHashedRefreshToken = 'hashed-refresh-token';
      (jwtService.sign as jest.Mock).mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedRefreshToken);
      (usersService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);
      (usersService.updateLastLogin as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.login(mockUser);

      expect(result).toEqual({
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockRefreshToken, 10);
      expect(usersService.setRefreshToken).toHaveBeenCalledWith(mockUser.id, mockHashedRefreshToken);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      const expectedPayload = {
        email: 'john@example.com',
        sub: 1,
        username: 'john',
        roles: [Role.Admin],
        area: ['Administración'],
        permissions: Object.values(Permission),
        active: true,
        mustChangePassword: false,
      };
      expect(jwtService.sign).toHaveBeenCalledWith(expectedPayload, { expiresIn: '5m' });
      expect(jwtService.sign).toHaveBeenCalledWith(expectedPayload, { expiresIn: '7d' });
    });
  });

  describe('logout', () => {
    it('debería llamar a usersService.setRefreshToken con null', async () => {
      const userId = 1;
      (usersService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      await authService.logout(userId);

      expect(usersService.setRefreshToken).toHaveBeenCalledWith(userId, null);
    });
  });

  describe('register', () => {
    it('debería registrar usuario llamando al usersService', async () => {
      const registerDto: RegisterDto = {
        username: 'john',
        email: 'john@example.com',
        password: 'admin123',
        area: 'Administración',
      };

      const mockResponse = {
        user: {
          id: 1,
          username: 'john',
          email: 'john@example.com',
          area: ['Administración'],
          roles: [Role.Admin],
          permissions: Object.values(Permission),
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true,
          mustChangePassword: true,
          lastLogin: null,
        },
        tempPassword: 'temp-password',
      };

      jest.spyOn(usersService, 'register').mockResolvedValue(mockResponse as any);

      const result = await authService.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(usersService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('refreshToken', () => {
    const mockUser = {
      id: 1,
      username: 'john',
      email: 'john@example.com',
      area: ['Administración'],
      password: 'hashedPassword',
      roles: [Role.Admin],
      permissions: Object.values(Permission),
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      mustChangePassword: false,
      lastLogin: null,
      refreshToken: 'hashed-old-refresh-token',
    };
    const oldToken = 'old-refresh-token';

    it('debería retornar un nuevo access_token si el refresh token es válido y el usuario está activo', async () => {
      const newAccessToken = 'new-access-token';
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: mockUser.id });
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue(newAccessToken);

      const result = await authService.refreshToken(oldToken);

      expect(result).toEqual({ access_token: newAccessToken });
      expect(jwtService.verify).toHaveBeenCalledWith(oldToken);
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(bcrypt.compare).toHaveBeenCalledWith(oldToken, mockUser.refreshToken);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ sub: mockUser.id }), { expiresIn: '5m' });
    });

    it('debería lanzar UnauthorizedException si el token es inválido', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(oldToken)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });

    it('debería lanzar UnauthorizedException si el usuario no se encuentra', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: mockUser.id });
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshToken(oldToken)).rejects.toThrow(new UnauthorizedException('Access Denied'));
    });

    it('debería lanzar UnauthorizedException si el usuario está inactivo', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: mockUser.id });
      (usersService.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(authService.refreshToken(oldToken)).rejects.toThrow(new UnauthorizedException('Access Denied'));
    });

    it('debería lanzar UnauthorizedException si el usuario no tiene un refreshToken en la BD', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: mockUser.id });
      (usersService.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshToken: null,
      });

      await expect(authService.refreshToken(oldToken)).rejects.toThrow(new UnauthorizedException('Access Denied'));
    });

    it('debería lanzar UnauthorizedException si el refreshToken no coincide', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: mockUser.id });
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.refreshToken(oldToken)).rejects.toThrow(new UnauthorizedException('Access Denied'));
    });
  });
});
