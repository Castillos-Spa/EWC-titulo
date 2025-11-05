import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';

type ExecutionContextOverrides = {
  type?: string;
  handler?: unknown;
  classRef?: unknown;
  request?: { headers?: Record<string, string | undefined> };
};

const createExecutionContext = (overrides: ExecutionContextOverrides = {}): ExecutionContext => {
  const request = overrides.request ?? { headers: {} };

  const contextMock = {
    getHandler: jest.fn().mockReturnValue(overrides.handler ?? {}),
    getClass: jest.fn().mockReturnValue(overrides.classRef ?? {}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
    }),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn().mockReturnValue(overrides.type ?? 'http'),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
  } as Record<string, any>;

  return contextMock as unknown as ExecutionContext;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new JwtAuthGuard(reflector);
  });

  describe('canActivate', () => {
    it('retorna true para contextos websocket', () => {
      const context = createExecutionContext({ type: 'ws' });

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).not.toHaveBeenCalled();
    });

    it('retorna true para rutas públicas', () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => key === IS_PUBLIC_KEY);
      const context = createExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('delegates to AuthGuard for rutas protegidas', () => {
      reflector.getAllAndOverride.mockImplementation(() => false);
      const parentMock = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(true);
      const context = createExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(parentMock).toHaveBeenCalledWith(context);
      parentMock.mockRestore();
    });

    it('permite auth opcional sin encabezado Authorization', () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => key === OPTIONAL_AUTH_KEY);
      const context = createExecutionContext({ request: { headers: {} } });

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(OPTIONAL_AUTH_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('delegates cuando auth opcional recibe token', () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => key === OPTIONAL_AUTH_KEY);
      const parentMock = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(true);
      const context = createExecutionContext({ request: { headers: { authorization: 'Bearer abc' } } });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(parentMock).toHaveBeenCalledWith(context);
      parentMock.mockRestore();
    });

    it('propaga errores del AuthGuard base', () => {
      reflector.getAllAndOverride.mockImplementation(() => false);
      const error = new Error('boom');
      const parentMock = jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockImplementation(() => {
        throw error;
      });
      const context = createExecutionContext();

      expect(() => guard.canActivate(context)).toThrow(error);
      parentMock.mockRestore();
    });

    it('maneja contextos múltiples sin contaminación entre llamadas', () => {
      const handlerA = { name: 'handlerA' };
      const classA = { name: 'classA' };
      const handlerB = { name: 'handlerB' };
      const classB = { name: 'classB' };

      reflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(createExecutionContext({ handler: handlerA, classRef: classA }));
      guard.canActivate(createExecutionContext({ handler: handlerB, classRef: classB }));

      expect(reflector.getAllAndOverride).toHaveBeenNthCalledWith(1, IS_PUBLIC_KEY, [handlerA, classA]);
      expect(reflector.getAllAndOverride).toHaveBeenNthCalledWith(2, IS_PUBLIC_KEY, [handlerB, classB]);
    });
  });

  describe('construcción', () => {
    it('usa el reflector inyectado', () => {
      expect(guard).toBeInstanceOf(JwtAuthGuard);
      expect((guard as any).reflector).toBe(reflector);
    });
  });

  describe('decoradores', () => {
    it('prefiere el decorador en el handler', () => {
      const handler = { [IS_PUBLIC_KEY]: true };
      const classRef = { [IS_PUBLIC_KEY]: false };
      const context = createExecutionContext({ handler, classRef });

      reflector.getAllAndOverride.mockImplementation((_key, [handlerRef, classRefRef]) => {
        return handlerRef[IS_PUBLIC_KEY] || classRefRef[IS_PUBLIC_KEY];
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('usa el decorador de la clase cuando el handler no lo define', () => {
      const handler = {};
      const classRef = { [IS_PUBLIC_KEY]: true };
      const context = createExecutionContext({ handler, classRef });

      reflector.getAllAndOverride.mockImplementation((_key, [handlerRef, classRefRef]) => {
        return handlerRef[IS_PUBLIC_KEY] || classRefRef[IS_PUBLIC_KEY];
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
