type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;

class MemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = this.ttlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
}

declare global {
  var __CJ_MEMORY_CACHE__: MemoryCache | undefined;
}

export function getMemoryCache(): MemoryCache {
  if (!globalThis.__CJ_MEMORY_CACHE__) {
    globalThis.__CJ_MEMORY_CACHE__ = new MemoryCache();
  }
  return globalThis.__CJ_MEMORY_CACHE__;
}
