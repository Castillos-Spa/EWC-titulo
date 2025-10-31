const DEFAULT_TTL_MS = 30_000;

export type FetchWithCacheOptions = {
  force?: boolean;
  ttlMs?: number;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: FetchWithCacheOptions = {}
): Promise<T> {
  const { force = false, ttlMs = DEFAULT_TTL_MS } = options;
  const now = Date.now();

  if (force) {
    cache.delete(key);
    inFlight.delete(key);
  } else {
    const cached = cache.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const pending = inFlight.get(key) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }
  }

  const fetchPromise = fetcher()
    .then((result) => {
      cache.set(key, { value: result, expiresAt: Date.now() + ttlMs });
      return result;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  inFlight.set(key, fetchPromise as Promise<unknown>);

  try {
    return await fetchPromise;
  } finally {
    const current = inFlight.get(key);
    if (current === fetchPromise) {
      inFlight.delete(key);
    }
  }
}

export function invalidateCache(keys: string | string[]): void {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    cache.delete(key);
    inFlight.delete(key);
  }
}

export function invalidateCacheByPrefix(prefix: string): void {
  const keysToInvalidate: string[] = [];
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      keysToInvalidate.push(key);
    }
  }
  for (const key of inFlight.keys()) {
    if (key.startsWith(prefix)) {
      keysToInvalidate.push(key);
    }
  }
  if (keysToInvalidate.length > 0) {
    invalidateCache(keysToInvalidate);
  }
}

export function clearRequestCache(): void {
  cache.clear();
  inFlight.clear();
}
