import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

// Mocks
const mockReflector = {
  getAllAndOverride: jest.fn(),
};

const mockExecutionContext = {
  getHandler: jest.fn(),
  getClass: jest.fn(),
  switchToHttp: jest.fn(),
};

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = mockReflector as any;
    rolesGuard = new RolesGuard(reflector);
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
    // FAST: Tests rápidos y simples
    it('debería retornar true cuando no hay roles requeridos (FAST)', () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(null);
      const context = createExecutionContext({ roles: [Role.Admin] });

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [context.getHandler(), context.getClass()]);
    });

    // ISOLATED: Test independiente que no depende de otros
    it('debería retornar true cuando el usuario tiene al menos un rol requerido (ISOLATED)', () => {
      // Arrange
      const requiredRoles = [Role.Admin, Role.Lector];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: [Role.Admin, Role.Trabajador] };
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledTimes(1);
    });

    // REPEATABLE: Test consistente que siempre da el mismo resultado
    it('debería retornar false cuando el usuario no tiene ningún rol requerido (REPEATABLE)', () => {
      // Arrange
      const requiredRoles = [Role.Admin];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: [Role.Trabajador] }; // Solo tiene Trabajador, no Admin
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    // SELF-VALIDATING: Resultado claro (true/false)
    it('debería retornar false cuando el usuario no tiene roles (SELF-VALIDATING)', () => {
      // Arrange
      const requiredRoles = [Role.Admin];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: [] }; // Array vacío de roles
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    // THOROUGH: Casos límite y edge cases
    it('debería manejar usuario sin propiedad roles (THOROUGH)', () => {
      // Arrange
      const requiredRoles = [Role.Admin];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = {}; // Usuario sin propiedad roles
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('debería manejar usuario con roles undefined (THOROUGH)', () => {
      // Arrange
      const requiredRoles = [Role.Admin];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: undefined }; // Roles undefined
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('debería manejar usuario con roles null (THOROUGH)', () => {
      // Arrange
      const requiredRoles = [Role.Admin];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: null }; // Roles null
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('debería manejar array vacío de roles requeridos (THOROUGH)', () => {
      // Arrange
      const requiredRoles: Role[] = []; // Array vacío de roles requeridos
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: [Role.Admin] };
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(true); // Array vacío significa que no hay restricciones
    });

    // THOROUGH: Casos con múltiples roles
    it('debería retornar true cuando el usuario tiene múltiples roles incluyendo el requerido', () => {
      // Arrange
      const requiredRoles = [Role.Admin];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: [Role.Lector, Role.Admin, Role.Trabajador] };
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    // THOROUGH: Casos con múltiples roles requeridos
    it('debería retornar true cuando se requieren múltiples roles y el usuario tiene al menos uno', () => {
      // Arrange
      const requiredRoles = [Role.Admin, Role.Trabajador];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: [Role.Lector, Role.Trabajador] }; // Tiene Trabajador
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('debería retornar false cuando se requieren múltiples roles y el usuario no tiene ninguno', () => {
      // Arrange
      const requiredRoles = [Role.Admin, Role.Especialista];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: [Role.Lector, Role.Trabajador] }; // No tiene Admin ni Especialista
      const context = createExecutionContext(user);

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    // FAST: Test de performance con muchos roles
    it('debería manejar eficientemente arrays grandes de roles (FAST)', () => {
      // Arrange
      const requiredRoles = Array(1000).fill(Role.Admin);
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { roles: [Role.Lector, Role.Admin] }; // Tiene Admin
      const context = createExecutionContext(user);

      // Act
      const startTime = performance.now();
      const result = rolesGuard.canActivate(context);
      const endTime = performance.now();

      // Assert
      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(10); // Menos de 10ms para 1000 roles
    });
  });

  // ISOLATED: Tests de integración con Reflector
  describe('integración con Reflector', () => {
    it('debería buscar roles en handler primero', () => {
      // Arrange
      const handler = jest.fn();
      const classRef = jest.fn();
      const requiredRoles = [Role.Admin];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const context = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(classRef),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user: { roles: [Role.Admin] } }),
        }),
      } as unknown as ExecutionContext;

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [handler, classRef]);
    });

    it('debería buscar roles en class si no hay en handler', () => {
      // Arrange
      const handler = null;
      const classRef = jest.fn();
      const requiredRoles = [Role.Admin];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const context = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(classRef),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user: { roles: [Role.Admin] } }),
        }),
      } as unknown as ExecutionContext;

      // Act
      const result = rolesGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [handler, classRef]);
    });
  });
});
