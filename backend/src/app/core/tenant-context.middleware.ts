import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(_req: Request, _res: Response, next: NextFunction) {
    this.tenantContext.run(
      {
        tenantId: null,
        tenantSlug: null,
        companyId: null,
        companyIds: [],
        modules: [],
      },
      () => next(),
    );
  }
}
