import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el objeto `user` completo que fue adjuntado a la solicitud
 * por el guard de autenticación (por ejemplo, JwtAuthGuard).
 */
export const AuthUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
