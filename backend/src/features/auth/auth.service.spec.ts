import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, AuthSession } from './auth.service';
import { UsersService } from '../users/users.service';
import { ModuleKey, ModuleStatus, Role, TenantStatus } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { PrismaService } from 'prisma/prisma.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { compare as bcryptCompare } from 'bcrypt';
import * as crypto from 'node:crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
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

  const tenant = {
    id: 77,
    slug: 'tenant-1',
    name: 'Tenant One',
    status: TenantStatus.ACTIVE,
    contactEmail: null,
    metadata: {},
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    modules: [
      {
        id: 1,
        tenantId: 77,
        module: ModuleKey.DASHBOARD,
        status: ModuleStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        trialEndsAt: null,
      },
    ],
    companies: [],
  } as any;

  const baseUser = {
    id: 1,
    email: 'test@example.com',
    username: 'tester',
    password: 'hashed',
    mustChangePassword: false,
    active: true,
    tenantId: tenant.id,
    primaryCompanyId: null,
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
    userCompanies: [],
    refreshToken: null,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new AuthService(usersService, jwtService, configService, prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockSession = {
    userId: baseUser.id,
    user: (({ password: _pw, ...rest }) => rest)(baseUser),
    tenant,
    modules: [ModuleKey.DASHBOARD],
    companies: [],
    companyId: null,
    payload: {
      sub: baseUser.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      companyId: null,
      companyIds: [],
      modules: [ModuleKey.DASHBOARD],
      email: baseUser.email,
      username: baseUser.username,
      areas: [],
      roles: [],
      permissions: [],
      rolesByArea: {},
      isAdmin: false,
      mustChangePassword: baseUser.mustChangePassword,
      active: baseUser.active,
    },
    userDetails: {
      id: baseUser.id,
      username: baseUser.username,
      email: baseUser.email,
      areas: [],
      roles: [],
      rolesByArea: {},
      isAdmin: false,
      mustChangePassword: baseUser.mustChangePassword,
      active: baseUser.active,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      companyId: null,
      companyIds: [],
      modules: [ModuleKey.DASHBOARD],
    },
  } as AuthSession;

  describe('validateUser', () => {
    it('returns null when user does not exist', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValueOnce(tenant);
      usersService.findByEmail.mockResolvedValueOnce(null as any);

      const result = await service.validateUser('missing@example.com', 'secret', tenant.slug);

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith('missing@example.com', tenant.id);
    });

    it('returns session when credentials are valid', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValueOnce(tenant);
      usersService.findByEmail.mockResolvedValueOnce(baseUser);
      (bcryptCompare as jest.Mock).mockResolvedValueOnce(true);
      const buildSessionSpy = jest
        .spyOn<any, any>(service as any, 'buildSessionContext')
        .mockReturnValueOnce(mockSession);

      const result = await service.validateUser(baseUser.email, 'secret', tenant.slug);

      expect(bcryptCompare).toHaveBeenCalledWith('secret', baseUser.password);
      expect(buildSessionSpy).toHaveBeenCalledWith(
        expect.not.objectContaining({ password: expect.anything() }),
        tenant,
        undefined,
      );
      expect(result).toBe(mockSession);
    });
  });

  describe('login', () => {
    it('issues tokens and stores refresh token hash', async () => {
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      configService.get.mockImplementation(key => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        if (key === 'REFRESH_TOKEN_SECRET') return 'refresh-hmac';
        return undefined;
      });

      const response = await service.login(mockSession);

      const expectedHash = crypto.createHmac('sha256', 'refresh-hmac').update('refresh-token').digest('hex');

      expect(jwtService.sign).toHaveBeenNthCalledWith(1, mockSession.payload);
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: mockSession.userId,
          email: mockSession.user.email,
          tenantId: mockSession.payload.tenantId,
          companyId: mockSession.companyId,
        },
        expect.objectContaining({ expiresIn: '7d', secret: 'refresh-secret' }),
      );
      expect(usersService.setRefreshToken).toHaveBeenCalledWith(mockSession.userId, expectedHash);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockSession.userId);
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

      jwtService.verify.mockReturnValueOnce({ sub: baseUser.id, tenantId: tenant.id });
      usersService.findById.mockResolvedValueOnce({ ...baseUser, refreshToken: hashed, active: true });
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValueOnce(tenant);
      jest
        .spyOn<any, any>(service as any, 'buildSessionContext')
        .mockReturnValueOnce({ ...mockSession, payload: { ...mockSession.payload } });
      jwtService.sign.mockReturnValueOnce('new-access-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toEqual(
        expect.objectContaining({
          access_token: 'new-access-token',
          user: mockSession.userDetails,
        }),
      );
      expect(usersService.findById).toHaveBeenCalledWith(baseUser.id, tenant.id);
    });

    it('throws when refresh token hash mismatches', async () => {
      const refreshToken = 'invalid-token';
      const hashed = crypto.createHmac('sha256', 'refresh-hmac').update('different').digest('hex');

      configService.get.mockImplementation(key => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'REFRESH_TOKEN_SECRET') return 'refresh-hmac';
        return undefined;
      });

      jwtService.verify.mockReturnValueOnce({ sub: baseUser.id, tenantId: tenant.id });
      usersService.findById.mockResolvedValueOnce({ ...baseUser, refreshToken: hashed, active: true });
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValueOnce(tenant);

      await expect(service.refreshToken(refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('discoverAccess', () => {
    it('returns empty discovery when email is unknown', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await service.discoverAccess('unknown@example.com');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: expect.objectContaining({ equals: 'unknown@example.com' }),
            active: true,
          }),
        }),
      );
      expect(result).toEqual({ email: 'unknown@example.com', tenants: [] });
    });

    it('assembles tenant options with companies and defaults', async () => {
      const userRecord = {
        id: 5,
        email: 'USER@example.com',
        tenantId: 401,
        active: true,
        primaryCompanyId: 9001,
        tenant: {
          id: 401,
          slug: 'tenant-401',
          name: 'Operaciones 401',
          status: TenantStatus.ACTIVE,
        },
        userCompanies: [
          {
            tenantId: 401,
            userId: 5,
            companyId: 9001,
            isDefault: true,
            company: {
              id: 9001,
              name: 'Compañía Principal',
              status: 'ACTIVE',
            },
          },
          {
            tenantId: 401,
            userId: 5,
            companyId: 9002,
            isDefault: false,
            company: {
              id: 9002,
              name: 'Compañía Secundaria',
              status: 'INACTIVE',
            },
          },
          {
            tenantId: 401,
            userId: 5,
            companyId: 9003,
            isDefault: false,
            company: {
              id: 9003,
              name: 'Compañía Archivada',
              status: 'ARCHIVED',
            },
          },
        ],
      } as any;

      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([userRecord]);

      const result = await service.discoverAccess('USER@example.com');

      expect(result.email).toBe('user@example.com');
      expect(result.tenants).toHaveLength(1);
      expect(result.tenants[0]).toEqual({
        tenant: {
          id: 401,
          slug: 'tenant-401',
          name: 'Operaciones 401',
          status: TenantStatus.ACTIVE,
        },
        defaultCompanyId: 9001,
        requiresCompanySelection: true,
        companies: [
          {
            id: 9001,
            name: 'Compañía Principal',
            status: 'ACTIVE',
            isDefault: true,
          },
          {
            id: 9002,
            name: 'Compañía Secundaria',
            status: 'INACTIVE',
            isDefault: false,
          },
        ],
      });
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
