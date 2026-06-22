import assert from "node:assert/strict";
import { createAsyncTtlCache } from "./async-ttl-cache";

async function main(): Promise<void> {
  let now = 1_000;
  let loads = 0;
  const cache = createAsyncTtlCache<number>({
    ttlMs: 100,
    now: () => now,
  });

  assert.equal(
    await cache.get("alpha", async () => {
      loads += 1;
      return loads;
    }),
    1,
  );

  assert.equal(
    await cache.get("alpha", async () => {
      loads += 1;
      return loads;
    }),
    1,
    "fresh cache entry should be reused",
  );

  now += 101;
  assert.equal(
    await cache.get("alpha", async () => {
      loads += 1;
      return loads;
    }),
    2,
    "expired cache entry should refresh",
  );

  assert.equal(
    await cache.get(
      "alpha",
      async () => {
        loads += 1;
        return loads;
      },
      { forceRefresh: true },
    ),
    3,
    "force refresh should bypass cached values",
  );

  let resolveLoad: ((value: number) => void) | null = null;
  const pendingLoad = new Promise<number>((resolve) => {
    resolveLoad = resolve;
  });
  const first = cache.get("beta", () => pendingLoad);
  const second = cache.get("beta", async () => {
    throw new Error("Concurrent cache load should be deduped.");
  });
  resolveLoad?.(42);
  assert.deepEqual(await Promise.all([first, second]), [42, 42]);

  cache.clear("beta");
  assert.equal(
    await cache.get("beta", async () => 43),
    43,
    "key-specific clear should remove only that cached value",
  );

  cache.clear();
  assert.equal(
    await cache.get("alpha", async () => 44),
    44,
    "full clear should remove all cached values",
  );

  let resolveClearedLoad: ((value: number) => void) | null = null;
  const clearedPending = cache.get(
    "cleared",
    () =>
      new Promise<number>((resolve) => {
        resolveClearedLoad = resolve;
      }),
  );
  cache.clear("cleared");
  resolveClearedLoad?.(50);
  assert.equal(await clearedPending, 50);
  assert.equal(
    await cache.get("cleared", async () => 51),
    51,
    "a load that resolves after clear must not repopulate the cache",
  );

  let resolveOldLoad: ((value: number) => void) | null = null;
  let resolveFreshLoad: ((value: number) => void) | null = null;
  const oldPending = cache.get(
    "refreshed",
    () =>
      new Promise<number>((resolve) => {
        resolveOldLoad = resolve;
      }),
  );
  const freshPending = cache.get(
    "refreshed",
    () =>
      new Promise<number>((resolve) => {
        resolveFreshLoad = resolve;
      }),
    { forceRefresh: true },
  );
  resolveOldLoad?.(60);
  resolveFreshLoad?.(61);
  assert.deepEqual(await Promise.all([oldPending, freshPending]), [60, 61]);
  assert.equal(
    await cache.get("refreshed", async () => 62),
    61,
    "a replaced in-flight load must not overwrite a newer refresh",
  );

  await assert.rejects(
    cache.get("sync-error", () => {
      throw new Error("sync loader failed");
    }),
    /sync loader failed/,
  );
  assert.equal(
    await cache.get("sync-error", async () => 70),
    70,
    "a synchronous loader failure must not poison later cache reads",
  );

  console.log("Async TTL cache tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
