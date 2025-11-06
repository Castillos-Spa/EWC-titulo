import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantExecutionContext {
  tenantId: number | null;
  tenantSlug: string | null;
  companyId: number | null;
  companyIds: number[];
  modules: string[];
}

const defaultContext: TenantExecutionContext = {
  tenantId: null,
  tenantSlug: null,
  companyId: null,
  companyIds: [],
  modules: [],
};

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantExecutionContext>();

  run(context: TenantExecutionContext, callback: () => void) {
    this.storage.run({ ...defaultContext, ...context }, callback);
  }

  enter(context: Partial<TenantExecutionContext>) {
    this.storage.enterWith({ ...defaultContext, ...context });
  }

  setContext(context: Partial<TenantExecutionContext>) {
    const store = this.storage.getStore();
    if (store) {
      Object.assign(store, context);
    }
  }

  getContext(): TenantExecutionContext {
    return this.storage.getStore() ?? { ...defaultContext };
  }

  get tenantId(): number | null {
    return this.storage.getStore()?.tenantId ?? null;
  }

  get tenantSlug(): string | null {
    return this.storage.getStore()?.tenantSlug ?? null;
  }

  get companyId(): number | null {
    return this.storage.getStore()?.companyId ?? null;
  }

  get companyIds(): number[] {
    return this.storage.getStore()?.companyIds ?? [];
  }

  get modules(): string[] {
    return this.storage.getStore()?.modules ?? [];
  }
}
