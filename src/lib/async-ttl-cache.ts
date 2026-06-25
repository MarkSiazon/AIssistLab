export interface AsyncTtlCacheOptions {
  ttlMs: number;
  now?: () => number;
}

interface AsyncTtlCacheGetOptions {
  forceRefresh?: boolean;
}

export interface AsyncTtlCache<T> {
  clear(key?: string): void;
  get(
    key: string,
    load: () => Promise<T>,
    options?: AsyncTtlCacheGetOptions,
  ): Promise<T>;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

interface InFlightEntry<T> {
  promise: Promise<T>;
  token: object;
}

export function createAsyncTtlCache<T>({
  ttlMs,
  now = () => Date.now(),
}: AsyncTtlCacheOptions): AsyncTtlCache<T> {
  const cached = new Map<string, CacheEntry<T>>();
  const inFlight = new Map<string, InFlightEntry<T>>();

  return {
    clear(key?: string) {
      if (key) {
        cached.delete(key);
        inFlight.delete(key);
        return;
      }

      cached.clear();
      inFlight.clear();
    },

    async get(key, load, options = {}) {
      if (!options.forceRefresh) {
        const entry = cached.get(key);
        if (entry && entry.expiresAt > now()) return entry.value;

        const pending = inFlight.get(key);
        if (pending) return pending.promise;
      }

      const token = {};
      const pending = Promise.resolve()
        .then(load)
        .then((value) => {
          if (inFlight.get(key)?.token === token) {
            cached.set(key, {
              expiresAt: now() + ttlMs,
              value,
            });
          }
          return value;
        });
      inFlight.set(key, { promise: pending, token });

      try {
        return await pending;
      } finally {
        if (inFlight.get(key)?.token === token) inFlight.delete(key);
      }
    },
  };
}
