import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleKey } from '@prisma/client';
import { TenantContextService } from '@/app/core/tenant-context.service';
import { REQUIRED_MODULES_KEY } from '../decorators/modules.decorator';

@Injectable()
export class TenantModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModules = this.reflector.getAllAndOverride<ModuleKey[]>(REQUIRED_MODULES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userModules: ModuleKey[] = request?.user?.modules ?? this.tenantContext.modules ?? [];

    if (userModules.length === 0) {
      return false;
    }

    return requiredModules.every(moduleKey => userModules.includes(moduleKey));
  }
}
