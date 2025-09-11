import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  // FAST: Setup rápido antes de cada test
  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new JwtAuthGuard(reflector);
  });

  // Helper para crear contexto de ejecución
  const createExecutionContext = (): ExecutionContext => ({
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
    getArgs: function <T extends Array<any> = any[]>(): T {
      throw new Error('Function not implemented.');
    },
    getArgByIndex: function <T = any>(index: number): T {
      throw new Error('Function not implemented.');
    },
  });

  describe('canActivate', () => {
    // FAST: Test rápido para endpoint público
    it('debería retornar true inmediatamente para endpoints públicos (FAST)', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = createExecutionContext();

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    // ISOLATED: Test independiente para endpoint no público
    it('debería delegar al AuthGuard padre para endpoints no públicos (ISOLATED)', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = createExecutionContext();

      // Mock del método padre
      const parentMock = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(parentMock).toHaveBeenCalledWith(context);
      parentMock.mockRestore();
    });

    // REPEATABLE: Comportamiento consistente
    it('debería comportarse consistentemente con diferentes valores (REPEATABLE)', () => {
      const context = createExecutionContext();

      // Test 1: IS_PUBLIC = true
      reflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);

      // Test 2: IS_PUBLIC = false, padre retorna true
      reflector.getAllAndOverride.mockReturnValue(false);
      const parentMock1 = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);
      parentMock1.mockRestore();

      // Test 3: IS_PUBLIC = false, padre retorna false
      reflector.getAllAndOverride.mockReturnValue(false);
      const parentMock2 = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(false);
      expect(guard.canActivate(context)).toBe(false);
      parentMock2.mockRestore();
    });

    // SELF-VALIDATING: Resultados booleanos claros
    it('debería retornar resultados auto-validantes claros (SELF-VALIDATING)', () => {
      const context = createExecutionContext();

      // Caso público
      reflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);

      // Caso no público con padre true
      reflector.getAllAndOverride.mockReturnValue(false);
      const parentMock1 = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);
      parentMock1.mockRestore();

      // Caso no público con padre false
      reflector.getAllAndOverride.mockReturnValue(false);
      const parentMock2 = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(false);
      expect(guard.canActivate(context)).toBe(false);
      parentMock2.mockRestore();
    });

    // THOROUGH: Casos límite completos
    it('debería manejar valores truthy como true para IS_PUBLIC (THOROUGH)', () => {
      const context = createExecutionContext();
      const truthyValues = [true, 1, 'true', [], {}];

      truthyValues.forEach(value => {
        reflector.getAllAndOverride.mockReturnValue(value);
        const result = guard.canActivate(context);
        expect(result).toBe(true);
      });
    });

    it('debería manejar valores falsy como false para IS_PUBLIC (THOROUGH)', () => {
      const context = createExecutionContext();
      const falsyValues = [false, 0, '', null, undefined];

      falsyValues.forEach(value => {
        reflector.getAllAndOverride.mockReturnValue(value);
        const parentMock = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(true);
        const result = guard.canActivate(context);
        expect(result).toBe(true); // Porque el padre retorna true
        parentMock.mockRestore();
      });
    });

    // THOROUGH: Manejo de errores
    it('debería propagar errores del AuthGuard padre (THOROUGH)', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = createExecutionContext();
      const error = new Error('Authentication failed');

      const parentMock = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow('Authentication failed');
      parentMock.mockRestore();
    });

    // FAST: Test de performance
    it('debería ser rápido para endpoints públicos (FAST)', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = createExecutionContext();
      const iterations = 100;
      const start = Date.now();

      // Act
      for (let i = 0; i < iterations; i++) {
        guard.canActivate(context);
      }
      const duration = Date.now() - start;

      // Assert
      expect(duration).toBeLessThan(50); // Menos de 50ms para 100 iteraciones
    });

    // ISOLATED: Diferentes contextos
    it('debería manejar diferentes contextos de forma aislada (ISOLATED)', () => {
      // Arrange
      const handler1 = { name: 'handler1' };
      const class1 = { name: 'class1' };
      const context1 = {
        getHandler: jest.fn().mockReturnValue(handler1),
        getClass: jest.fn().mockReturnValue(class1),
      } as unknown as ExecutionContext;

      const handler2 = { name: 'handler2' };
      const class2 = { name: 'class2' };
      const context2 = {
        getHandler: jest.fn().mockReturnValue(handler2),
        getClass: jest.fn().mockReturnValue(class2),
      } as unknown as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue(true);

      // Act
      guard.canActivate(context1);
      guard.canActivate(context2);

      // Assert
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [handler1, class1]);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [handler2, class2]);
    });
  });

  // THOROUGH: Tests de construcción
  describe('construcción', () => {
    it('debería crearse correctamente con el reflector inyectado', () => {
      // Assert
      expect(guard).toBeInstanceOf(JwtAuthGuard);
      expect(guard).toHaveProperty('reflector', reflector);
    });

    it('debería llamar al constructor padre sin errores', () => {
      // Act & Assert
      try {
        guard = new JwtAuthGuard(reflector);
        expect(true).toBe(true); // Siempre pasa si no hay error
      } catch (error) {
        // Si hay un error, el test falla
        expect(error).toBeUndefined();
      }
    });
  });

  // THOROUGH: Comportamiento con decoradores
  describe('integración con decoradores', () => {
    it('debería buscar IS_PUBLIC_KEY en handler y class', () => {
      // Arrange
      const handler = { [IS_PUBLIC_KEY]: true };
      const classRef = { [IS_PUBLIC_KEY]: false };
      const context = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(classRef),
      } as unknown as ExecutionContext;

      reflector.getAllAndOverride.mockImplementation((key, sources) => {
        // Simula el comportamiento real: handler primero, luego class
        return sources[0][IS_PUBLIC_KEY] || sources[1][IS_PUBLIC_KEY];
      });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true); // Toma el valor del handler
    });

    it('debería usar el class cuando el handler no tiene decorador', () => {
      // Arrange
      const handler = {}; // Sin decorador
      const classRef = { [IS_PUBLIC_KEY]: true }; // Class tiene decorador
      const context = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(classRef),
      } as unknown as ExecutionContext;

      reflector.getAllAndOverride.mockImplementation((key, sources) => {
        return sources[0][IS_PUBLIC_KEY] || sources[1][IS_PUBLIC_KEY];
      });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true); // Toma el valor del class
    });
  });
});
