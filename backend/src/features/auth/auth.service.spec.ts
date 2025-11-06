import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { compare as bcryptCompare } from 'bcrypt';
import * as crypto from 'node:crypto';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    setRefreshToken: jest.fn(),
    updateLastLogin: jest.fn(),
    register: jest.fn(),
    findById: jest.fn(),
    changePassword: jest.fn(),
    regenerateTempPassword: jest.fn(),
    isSupervisor: jest.fn(),
    isJefe: jest.fn(),
    getAreasByRole: jest.fn(),
    canAccessArea: jest.fn(),
    getHighestRoleInArea: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  const baseUser = {
    id: 1,
    email: 'test@example.com',
    username: 'tester',
    password: 'hashed',
    mustChangePassword: false,
    active: true,
    roleAssignments: [
      {
        id: 1,
        area: 'Transporte',
        role: 'Supervisor' as Role,
        permissions: ['read'],
        isActive: true,
        specialty: null,
      },
    ],
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(usersService, jwtService, configService);
  });

  describe('validateUser', () => {
    it('returns null when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null as any);

      const result = await service.validateUser('missing@example.com', 'secret');

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith('missing@example.com');
    });

    it('returns user data without password when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValueOnce(baseUser);
      (bcryptCompare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.validateUser(baseUser.email, 'secret');

      expect(bcryptCompare).toHaveBeenCalledWith('secret', baseUser.password);
      expect(result).toEqual(
        expect.objectContaining({
          id: baseUser.id,
          email: baseUser.email,
          username: baseUser.username,
        }),
      );
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('issues tokens and stores refresh token hash', async () => {
      const { password, ...userWithoutPassword } = baseUser;

      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      configService.get.mockImplementation(key => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        if (key === 'REFRESH_TOKEN_SECRET') return 'refresh-hmac';
        return undefined;
      });

      const response = await service.login(userWithoutPassword);

      const expectedHash = crypto.createHmac('sha256', 'refresh-hmac').update('refresh-token').digest('hex');

      expect(jwtService.sign).toHaveBeenNthCalledWith(1, expect.objectContaining({ sub: baseUser.id }));
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: baseUser.id, email: baseUser.email },
        expect.objectContaining({ expiresIn: '7d', secret: 'refresh-secret' }),
      );
      expect(usersService.setRefreshToken).toHaveBeenCalledWith(baseUser.id, expectedHash);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(baseUser.id);
      expect(response).toEqual(
        expect.objectContaining({ access_token: 'access-token', refresh_token: 'refresh-token' }),
      );
    });
  });

  describe('logout', () => {
    it('clears stored refresh token', async () => {
      await service.logout(99);

      expect(usersService.setRefreshToken).toHaveBeenCalledWith(99, null);
    });
  });

  describe('register', () => {
    it('delegates to UsersService', async () => {
      usersService.register.mockResolvedValueOnce({ user: { id: 1 } } as any);

      const dto = { email: 'new@example.com' } as any;
      await service.register(dto);

      expect(usersService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('refreshToken', () => {
    it('creates new access token when refresh token is valid', async () => {
      const refreshToken = 'valid-token';
      const hashed = crypto.createHmac('sha256', 'refresh-hmac').update(refreshToken).digest('hex');

      configService.get.mockImplementation(key => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'REFRESH_TOKEN_SECRET') return 'refresh-hmac';
        return undefined;
      });

      jwtService.verify.mockReturnValueOnce({ sub: baseUser.id });
      usersService.findById.mockResolvedValueOnce({ ...baseUser, refreshToken: hashed });
      jwtService.sign.mockReturnValueOnce('new-access-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toEqual(
        expect.objectContaining({
          access_token: 'new-access-token',
          user: expect.objectContaining({ id: baseUser.id }),
        }),
      );
    });

    it('throws when refresh token hash mismatches', async () => {
      const refreshToken = 'invalid-token';
      const hashed = crypto.createHmac('sha256', 'refresh-hmac').update('different').digest('hex');

      configService.get.mockImplementation(key => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'REFRESH_TOKEN_SECRET') return 'refresh-hmac';
        return undefined;
      });

      jwtService.verify.mockReturnValueOnce({ sub: baseUser.id });
      usersService.findById.mockResolvedValueOnce({ ...baseUser, refreshToken: hashed });

      await expect(service.refreshToken(refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('role helpers', () => {
    it('delegates changePassword', async () => {
      usersService.changePassword.mockResolvedValueOnce({ success: true } as any);

      await service.changePassword(1, 'old', 'new');

      expect(usersService.changePassword).toHaveBeenCalledWith(1, 'old', 'new');
    });

    it('delegates regenerateTempPassword', async () => {
      usersService.regenerateTempPassword.mockResolvedValueOnce({ tempPassword: 'tmp' });

      await service.regenerateTempPassword(2);

      expect(usersService.regenerateTempPassword).toHaveBeenCalledWith(2);
    });
  });
});
