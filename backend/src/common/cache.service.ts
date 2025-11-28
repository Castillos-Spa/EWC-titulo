import { Injectable } from '@nestjs/common';

type CacheEntry = {
  value: any;
  expireAt?: number;
};

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry>();

  get<T = any>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expireAt && Date.now() > entry.expireAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: any, ttlMs?: number) {
    const expireAt = ttlMs ? Date.now() + ttlMs : undefined;
    this.store.set(key, { value, expireAt });
    if (ttlMs) {
      setTimeout(() => {
        const cur = this.store.get(key);
        if (cur && cur.expireAt === expireAt) {
          this.store.delete(key);
        }
      }, ttlMs + 50);
    }
  }

  del(key: string) {
    this.store.delete(key);
  }

  delPrefix(prefix: string) {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear() {
    this.store.clear();
  }
}
