import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { TenantContextService } from '@/app/core/tenant-context.service';

type TenantQueryContext = {
  model: string;
  operation: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: (args: any) => Promise<unknown>;
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private isConnected = false;
  private readonly delegate: PrismaClient;

  private readonly tenantScopedModels = new Set([
    'User',
    'UserRoleAssignment',
    'ApprovalWorkflow',
    'Ticket',
    'Vehiculo',
    'Documento',
    'OrdenTrabajo',
    'QA',
    'SolicitudCompra',
    'Repuesto',
    'Notification',
    'UserNotification',
    'TicketApproval',
    'FuelLog',
    'Incident',
    'TransportRoute',
    'TruckAssignment',
    'Aseo',
    'CivilWork',
    'Company',
    'TenantModule',
    'UserCompany',
  ]);

  constructor(private readonly tenantContext: TenantContextService) {
    super();

    const tenantScopedQueryHandler = this.createTenantScopedQueryHandler.bind(this);

    const tenantExtension = Prisma.defineExtension(((client: PrismaClient) => ({
      query: {
        $allModels: {
          async $allOperations(params: TenantQueryContext) {
            return tenantScopedQueryHandler(client, params);
          },
        },
      },
    })) as unknown as never);

    this.delegate = this.$extends(tenantExtension as never) as unknown as PrismaClient;

    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop === 'delegate') {
          return target.delegate;
        }

        if (prop in target || typeof prop === 'symbol' || prop === 'then') {
          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        }

        const delegateValue = Reflect.get(target.delegate, prop);
        if (typeof delegateValue === 'function') {
          return delegateValue.bind(target.delegate);
        }
        return delegateValue;
      },
    });
  }

  private createTenantScopedQueryHandler(client: PrismaClient) {
    return async ({ model, operation, args, query }: TenantQueryContext) => {
      await this.$connectSafe();

      const tenantId = this.tenantContext.tenantId;
      if (!tenantId || !this.tenantScopedModels.has(model)) {
        return query(args ?? {});
      }

      const scopedArgs = this.normalizeArgs(args);
      const delegate = this.getDelegate(client, model);

      switch (operation) {
        case 'findUnique': {
          const tenantAwareWhere = this.withTenantFilter(
            scopedArgs.where as Record<string, unknown> | undefined,
            tenantId,
          );
          const result = await query(args ?? {});
          if (!result) {
            return result;
          }
          const isAccessible = await delegate.findFirst({ where: tenantAwareWhere, select: { id: true } });
          return isAccessible ? result : null;
        }
        case 'update': {
          const tenantAwareWhere = this.withTenantFilter(
            scopedArgs.where as Record<string, unknown> | undefined,
            tenantId,
          );
          const existing = await delegate.findFirst({ where: tenantAwareWhere, select: { id: true } });
          if (!existing) {
            throw new Error('Registro no accesible en el tenant actual.');
          }
          scopedArgs.data = this.withTenantData(scopedArgs.data, tenantId);
          return query(scopedArgs);
        }
        case 'delete': {
          const tenantAwareWhere = this.withTenantFilter(
            scopedArgs.where as Record<string, unknown> | undefined,
            tenantId,
          );
          const existing = await delegate.findFirst({ where: tenantAwareWhere, select: { id: true } });
          if (!existing) {
            throw new Error('Registro no accesible en el tenant actual.');
          }
          return query(args ?? {});
        }
        case 'upsert': {
          const tenantAwareWhere = this.withTenantFilter(
            scopedArgs.where as Record<string, unknown> | undefined,
            tenantId,
          );
          const existingForTenant = await delegate.findFirst({ where: tenantAwareWhere, select: { id: true } });
          const existingAnyTenant = await delegate.findFirst({
            where: scopedArgs.where as Record<string, unknown>,
            select: { id: true },
          });

          if (existingAnyTenant && !existingForTenant) {
            throw new Error('Registro no accesible en el tenant actual.');
          }

          scopedArgs.create = this.withTenantCreateData(scopedArgs.create, tenantId);
          scopedArgs.update = this.withTenantData(scopedArgs.update, tenantId);
          return query(scopedArgs);
        }
        default:
          this.applyTenantScope(operation, scopedArgs, tenantId);
          return query(scopedArgs);
      }
    };
  }

  private normalizeArgs(args: unknown) {
    if (args && typeof args === 'object' && !Array.isArray(args)) {
      return { ...(args as Record<string, unknown>) };
    }

    return {} as Record<string, unknown>;
  }

  private applyTenantScope(operation: string, args: Record<string, unknown>, tenantId: number) {
    switch (operation) {
      case 'findFirst':
      case 'findMany':
      case 'count':
      case 'aggregate':
      case 'deleteMany':
      case 'updateMany':
      case 'groupBy': {
        args.where = this.withTenantFilter(args.where as Record<string, unknown> | undefined, tenantId);
        break;
      }
      case 'create': {
        args.data = this.withTenantCreateData(args.data, tenantId);
        break;
      }
      case 'createMany':
      case 'createManyAndReturn': {
        args.data = this.withTenantCreateData(args.data, tenantId);
        break;
      }
      default:
        break;
    }
  }

  private getDelegate(client: PrismaClient, model: string) {
    const property = model.charAt(0).toLowerCase() + model.slice(1);
    return (client as unknown as Record<string, unknown>)[property] as Record<string, (...args: unknown[]) => unknown>;
  }

  async $connectSafe() {
    if (!this.isConnected) {
      try {
        await this.$connect();
        this.isConnected = true;
        console.log('✅ Conexión establecida con Prisma/Neon');
      } catch (error) {
        console.warn('⚠ Prisma no pudo conectar aún. Reintentará automáticamente cuando se use.', error);
        throw error;
      }
    }
  }

  // Sobrescribimos cualquier query para forzar reconexión si no está conectado
  async $useMiddleware() {
    await this.$connectSafe();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private withTenantFilter(where: Record<string, unknown> | undefined, tenantId: number) {
    if (!where || Object.keys(where).length === 0) {
      return { tenantId };
    }

    if ('tenantId' in where) {
      return where;
    }

    return {
      AND: [where, { tenantId }],
    };
  }

  private withTenantData(data: unknown, tenantId: number) {
    if (!data) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.withTenantData(item, tenantId));
    }

    if (typeof data !== 'object') {
      return data;
    }

    const result: Record<string, unknown> = { ...(data as Record<string, unknown>) };

    if (!('tenantId' in result) || result.tenantId == null) {
      result.tenantId = tenantId;
    }

    return result;
  }

  private withTenantCreateData(data: unknown, tenantId: number) {
    if (!data) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.withTenantCreateData(item, tenantId));
    }

    if (typeof data !== 'object') {
      return data;
    }

    const result = this.withTenantData(data, tenantId) as Record<string, unknown>;

    if (!('tenant' in result) || result.tenant == null) {
      result.tenant = { connect: { id: tenantId } };
    }

    return result;
  }
}
