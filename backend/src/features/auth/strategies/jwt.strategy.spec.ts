import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleKey, Permission, Role } from '@prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  const buildValidPayload = (): JwtPayload & { iat: number; exp: number } => ({
    sub: 123,
    email: 'test@example.com',
    username: 'tester',
    areas: ['Transporte'],
    roles: [Role.Admin],
    permissions: [Permission.MANAGE_TICKETS],
    rolesByArea: {
      Transporte: {
        role: Role.Admin,
        specialty: null,
        permissions: [Permission.MANAGE_TICKETS],
        isActive: true,
      },
    },
    isAdmin: true,
    mustChangePassword: false,
    active: true,
    tenantId: 55,
    tenantSlug: 'tenant-55',
    companyId: 101,
    companyIds: [101, 202],
    modules: [ModuleKey.DASHBOARD],
    iat: 1620000000,
    exp: 1620003600,
  });

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('test-secret-key'),
    } as unknown as jest.Mocked<ConfigService>;
    jwtStrategy = new JwtStrategy(configService);
  });

  describe('validate', () => {
    it('debería retornar el payload validado correctamente', async () => {
      const payload = buildValidPayload();

      const result = await jwtStrategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        tenantId: payload.tenantId,
        tenantSlug: payload.tenantSlug,
        companyId: payload.companyId,
        companyIds: payload.companyIds,
        modules: payload.modules,
        email: payload.email,
        username: payload.username,
        areas: payload.areas,
        roles: payload.roles,
        permissions: payload.permissions,
        rolesByArea: payload.rolesByArea,
        isAdmin: payload.isAdmin,
        active: payload.active,
        mustChangePassword: payload.mustChangePassword,
      });
    });

    it('debería lanzar UnauthorizedException para payload sin sub', async () => {
      const { sub, ...rest } = buildValidPayload();
      const invalidPayload = { ...rest } as unknown as JwtPayload;

      await expect(jwtStrategy.validate(invalidPayload)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(invalidPayload)).rejects.toThrow('Token invalido: falta user ID');
    });

    it('debería lanzar UnauthorizedException para payload sin email', async () => {
      const { email, ...rest } = buildValidPayload();
      const invalidPayload = { ...rest } as unknown as JwtPayload;

      await expect(jwtStrategy.validate(invalidPayload)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(invalidPayload)).rejects.toThrow('Token invalido: falta email');
    });

    it('debería lanzar UnauthorizedException para payload vacío', async () => {
      await expect(jwtStrategy.validate({} as JwtPayload)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate({} as JwtPayload)).rejects.toThrow('Token invalido: falta user ID');
    });

    it('debería lanzar UnauthorizedException para payload nulo', async () => {
      await expect(jwtStrategy.validate(null as unknown as JwtPayload)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(null as unknown as JwtPayload)).rejects.toThrow(
        'Token inválido: payload incorrecto',
      );
    });

    it('debería lanzar UnauthorizedException para payload undefined', async () => {
      await expect(jwtStrategy.validate(undefined as unknown as JwtPayload)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(undefined as unknown as JwtPayload)).rejects.toThrow(
        'Token inválido: payload incorrecto',
      );
    });

    it('debería lanzar UnauthorizedException para payload que no es objeto', async () => {
      await expect(jwtStrategy.validate('string' as unknown as JwtPayload)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(123 as unknown as JwtPayload)).rejects.toThrow(UnauthorizedException);
    });

    it('debería manejar payload sin campos opcionales', async () => {
      const payload = buildValidPayload();
      const { roles, permissions, rolesByArea, modules, companyIds, ...rest } = payload;
      const minimalPayload = {
        ...rest,
        roles: undefined,
        permissions: undefined,
        rolesByArea: {} as any,
        modules: undefined,
        companyIds: undefined,
      } as unknown as JwtPayload;

      const result = await jwtStrategy.validate(minimalPayload);

      expect(result).toEqual(
        expect.objectContaining({
          userId: payload.sub,
          email: payload.email,
          roles: undefined,
          permissions: undefined,
          modules: [],
          companyIds: [],
        }),
      );
    });

    it('debería manejar payload con roles y permisos vacíos', async () => {
      const payload = buildValidPayload();
      const emptyCollectionsPayload = {
        ...payload,
        roles: [],
        permissions: [],
        rolesByArea: {},
        modules: [],
        companyIds: [],
      } as unknown as JwtPayload;

      const result = await jwtStrategy.validate(emptyCollectionsPayload);

      expect(result).toEqual(
        expect.objectContaining({
          roles: [],
          permissions: [],
          rolesByArea: {},
          modules: [],
          companyIds: [],
        }),
      );
    });

    it('debería lanzar UnauthorizedException cuando falta tenantId', async () => {
      const { tenantId, ...rest } = buildValidPayload();
      const invalidPayload = { ...rest, tenantId: undefined } as unknown as JwtPayload;

      await expect(jwtStrategy.validate(invalidPayload)).rejects.toThrow('Token invalido: falta tenant');
    });

    it('debería lanzar UnauthorizedException cuando falta tenantSlug', async () => {
      const { tenantSlug, ...rest } = buildValidPayload();
      const invalidPayload = { ...rest, tenantSlug: undefined } as unknown as JwtPayload;

      await expect(jwtStrategy.validate(invalidPayload)).rejects.toThrow('Token invalido: falta tenant slug');
    });
  });
});
