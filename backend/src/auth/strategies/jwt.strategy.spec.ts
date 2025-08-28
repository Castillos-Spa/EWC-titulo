import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

// Mock simple de las constants
jest.mock('../constants', () => ({
  jwtConstants: {
    secret: 'test-secret-key',
  },
}));

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;

  beforeEach(() => {
    jwtStrategy = new JwtStrategy();
  });

  describe('validate', () => {
    it('debería retornar el payload validado correctamente', async () => {
      const mockPayload = {
        sub: 123,
        email: 'test@example.com',
        roles: ['admin'],
        permissions: ['read', 'write'],
        iat: 1620000000,
        exp: 1620003600,
      };

      const result = await jwtStrategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 123,
        email: 'test@example.com',
        roles: ['admin'],
        permissions: ['read', 'write'],
      });
    });

    it('debería lanzar UnauthorizedException para payload sin sub', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        roles: ['admin'],
        iat: 1620000000,
        exp: 1620003600,
      };

      await expect(jwtStrategy.validate(invalidPayload as any)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(invalidPayload as any)).rejects.toThrow('Token invalido: falta user ID');
    });

    it('debería lanzar UnauthorizedException para payload sin email', async () => {
      const invalidPayload = {
        sub: 123,
        roles: ['admin'],
        iat: 1620000000,
        exp: 1620003600,
      };

      await expect(jwtStrategy.validate(invalidPayload as any)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(invalidPayload as any)).rejects.toThrow('Token invalido: falta email');
    });

    it('debería lanzar UnauthorizedException para payload vacío', async () => {
      await expect(jwtStrategy.validate({} as any)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate({} as any)).rejects.toThrow('Token invalido: falta user ID');
    });

    it('debería lanzar UnauthorizedException para payload nulo', async () => {
      await expect(jwtStrategy.validate(null as any)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(null as any)).rejects.toThrow('Token inválido: payload incorrecto');
    });

    it('debería lanzar UnauthorizedException para payload undefined', async () => {
      await expect(jwtStrategy.validate(undefined as any)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(undefined as any)).rejects.toThrow('Token inválido: payload incorrecto');
    });

    it('debería lanzar UnauthorizedException para payload que no es objeto', async () => {
      await expect(jwtStrategy.validate('string' as any)).rejects.toThrow(UnauthorizedException);
      await expect(jwtStrategy.validate(123 as any)).rejects.toThrow(UnauthorizedException);
    });

    it('debería manejar payload sin roles y permisos', async () => {
      const mockPayload = {
        sub: 123,
        email: 'test@example.com',
        iat: 1620000000,
        exp: 1620003600,
      };

      const result = await jwtStrategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 123,
        email: 'test@example.com',
        roles: undefined,
        permissions: undefined,
      });
    });

    it('debería manejar payload con roles y permisos vacíos', async () => {
      const mockPayload = {
        sub: 123,
        email: 'test@example.com',
        roles: [],
        permissions: [],
        iat: 1620000000,
        exp: 1620003600,
      };

      const result = await jwtStrategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 123,
        email: 'test@example.com',
        roles: [],
        permissions: [],
      });
    });
  });
});
