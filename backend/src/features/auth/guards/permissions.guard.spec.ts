import { Test } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

// Mocks aislados para este test
const mockReflector = {
  getAllAndOverride: jest.fn(),
};

describe('PermissionsGuard', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PermissionsGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    permissionsGuard = moduleRef.get<PermissionsGuard>(PermissionsGuard);
    moduleRef.get<Reflector>(Reflector);
    jest.clearAllMocks();
  });

  // Helper para crear contexto de ejecución mock
  const createExecutionContext = (user: any, handler?: Function, classRef?: any) => {
    return {
      getHandler: jest.fn().mockReturnValue(handler || {}),
      getClass: jest.fn().mockReturnValue(classRef || {}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('debería retornar true cuando no hay permisos requeridos', () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(null);
      const context = createExecutionContext({ permissions: [Permission.VIEW_DASHBOARD] });

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('debería retornar true cuando el usuario tiene al menos un permiso requerido', () => {
      // Arrange - Usa permisos que existan en tu sistema
      const requiredPermissions = [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = { permissions: [Permission.VIEW_DASHBOARD, Permission.MANAGE_TICKETS] };
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('debería retornar false cuando el usuario no tiene ningún permiso requerido', () => {
      // Arrange
      const requiredPermissions = [Permission.VIEW_DASHBOARD];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = { permissions: [Permission.VIEW_TICKETS] };
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('debería retornar false cuando el usuario no tiene permisos', () => {
      // Arrange
      const requiredPermissions = [Permission.VIEW_DASHBOARD];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = { permissions: [] };
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('debería manejar usuario sin propiedad permissions', () => {
      // Arrange
      const requiredPermissions = [Permission.VIEW_DASHBOARD];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = {};
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('debería manejar usuario con permissions undefined', () => {
      // Arrange
      const requiredPermissions = [Permission.VIEW_DASHBOARD];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = { permissions: undefined };
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('debería manejar usuario con permissions null', () => {
      // Arrange
      const requiredPermissions = [Permission.VIEW_DASHBOARD];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = { permissions: null };
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('debería retornar true cuando el array de permisos requeridos está vacío', () => {
      // Arrange
      const requiredPermissions: Permission[] = [];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = { permissions: [Permission.VIEW_DASHBOARD] };
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('debería retornar true cuando se requieren múltiples permisos y el usuario tiene al menos uno', () => {
      // Arrange - Usa permisos que existan
      const requiredPermissions = [Permission.VIEW_DASHBOARD, Permission.MANAGE_TICKETS];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = { permissions: [Permission.VIEW_TICKETS, Permission.MANAGE_TICKETS] };
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('debería retornar false cuando se requieren múltiples permisos y el usuario no tiene ninguno', () => {
      // Arrange
      const requiredPermissions = [Permission.VIEW_DASHBOARD, Permission.MANAGE_TICKETS];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const user = { permissions: [Permission.VIEW_TICKETS] };
      const context = createExecutionContext(user);

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('integración con Reflector', () => {
    it('debería buscar permisos en handler primero', () => {
      // Arrange
      const handler = jest.fn();
      const classRef = jest.fn();
      const requiredPermissions = [Permission.VIEW_DASHBOARD];
      mockReflector.getAllAndOverride.mockReturnValue(requiredPermissions);

      const context = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(classRef),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user: { permissions: [Permission.VIEW_DASHBOARD] } }),
        }),
      } as unknown as ExecutionContext;

      // Act
      const result = permissionsGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(PERMISSIONS_KEY, [handler, classRef]);
    });
  });
});
