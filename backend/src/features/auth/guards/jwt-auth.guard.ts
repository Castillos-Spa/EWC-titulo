import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';
import { TenantContextService } from '@/app/core/tenant-context.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // No interceptar websockets; el gateway maneja su propia auth
    if (context.getType() === 'ws') {
      return true;
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const allowOptionalAuth = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowOptionalAuth) {
      const request = context.switchToHttp().getRequest();
      const hasAuthorization = Boolean(request?.headers?.authorization);
      if (!hasAuthorization) {
        return true;
      }
    }

    return super.canActivate(context);
  }

  handleRequest(err: unknown, user: any, info: unknown, context: ExecutionContext) {
    const result = super.handleRequest(err, user, info, context);

    if (result) {
      this.tenantContext.setContext({
        tenantId: result.tenantId ?? null,
        tenantSlug: result.tenantSlug ?? null,
        companyId: result.companyId ?? null,
        companyIds: result.companyIds ?? [],
        modules: result.modules ?? [],
      });
    }

    return result;
  }
}
