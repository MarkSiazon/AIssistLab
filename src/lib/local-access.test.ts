import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  forbidNonLocalCliRequest,
  forbidNonLocalDeviceRequest,
  withLocalCliGuard,
  withLocalDeviceGuard,
} from "./local-access";
import { withEnv } from "@/lib/test-utils/env";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  assert.match(
    manifest.scripts.dev,
    /--hostname 127\.0\.0\.1(?:\s|$)/,
    "the supported development command must bind only to loopback",
  );

  await withEnv({ NODE_ENV: "development", VERCEL: undefined }, async () => {
    const guards = [forbidNonLocalCliRequest, forbidNonLocalDeviceRequest];
    const blockedBrowserHeaders: Array<Record<string, string>> = [
      { origin: "https://attacker.example" },
      { origin: "" },
      { origin: "null" },
      { origin: "http://127.0.0.1:3001" },
      { origin: "http://localhost:3000" },
      { origin: "https://127.0.0.1:3000" },
      { origin: "http://127.0.0.1:3000/" },
      { "sec-fetch-site": "cross-site" },
      { "sec-fetch-site": "same-site" },
      { "sec-fetch-site": "unknown" },
      { origin: "http://127.0.0.1:3000", "sec-fetch-site": "cross-site" },
      { "sec-fetch-site": "same-origin" },
      { "sec-fetch-site": "none" },
    ];
    for (const guard of guards) {
      for (const headers of blockedBrowserHeaders) {
        const blocked = guard(localRequest("/api/settings", {
          method: "POST",
          headers,
          body: "{",
        }));
        assert.equal(blocked?.status, 403, JSON.stringify(headers));
      }
      for (const host of [
        "0.0.0.0:3000", "localhost.evil:3000", "localhost@attacker.example",
        "localhost:65536", "localhost:3000/path", "[::1", "127.0.0.2:3000",
      ]) {
        assert.equal(guard(localRequest("/api/settings", { host }))?.status, 403, host);
      }
      assert.equal(guard(new Request("http://127.0.0.1:3000/api/settings"))?.status, 403);
      assert.equal(guard(localRequest("/api/settings", {
        method: "POST", body: "{}",
      })), null, "headerless direct CLI callers remain supported on loopback");
      assert.equal(guard(localRequest("/api/settings", {
        headers: { "sec-fetch-site": "cross-site" },
      }))?.status, 403, "cross-site reads cannot reach private local state");
      assert.equal(guard(localRequest("/api/settings", {
        headers: { origin: "https://attacker.example" },
      }))?.status, 403, "foreign-origin reads cannot reach private local state");
      assert.equal(guard(localRequest("/api/settings", {
        method: "POST", headers: {
          origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-origin",
        }, body: "{}",
      })), null, "same-origin browser writes remain supported");
      assert.equal(guard(localRequest("/api/settings", {
        headers: { "sec-fetch-site": "same-origin" },
      })), null, "same-origin browser reads need not send Origin");
      assert.equal(guard(localRequest("/api/settings", {
        headers: { "sec-fetch-site": "none" },
      })), null, "direct browser navigation remains supported");
      assert.equal(guard(localRequest("/api/settings", {
        host: "localhost:3000", method: "POST",
        headers: { origin: "http://localhost:3000", "sec-fetch-site": "same-origin" },
      })), null, "localhost browser alias can differ from Next's bound URL hostname");
      assert.equal(guard(localRequest("http://[::1]:3000/api/settings", {
        host: "[::1]:3000", method: "POST",
        headers: { origin: "http://[::1]:3000", "sec-fetch-site": "same-origin" },
      })), null, "valid IPv6 loopback authority is recognized");
      assert.equal(guard(localRequest("https://localhost:3443/api/settings", {
        host: "localhost:3443", method: "POST",
        headers: { origin: "https://localhost:3443", "sec-fetch-site": "same-origin" },
      })), null, "an explicitly configured HTTPS local origin stays exact");
    }
    assert.equal(
      forbidNonLocalDeviceRequest(localRequest("/api/settings")),
      null,
    );

    const deviceResponse = forbidNonLocalDeviceRequest(
      nonLocalRequest("/api/settings"),
    );
    assert.equal(deviceResponse?.status, 403);
    assert.deepEqual(await json(deviceResponse), {
      error: "Local device access can only be used from localhost.",
    });

    const cliResponse = forbidNonLocalCliRequest(
      nonLocalRequest("/api/settings/claude-cli"),
    );
    assert.equal(cliResponse?.status, 403);
    assert.deepEqual(await json(cliResponse), {
      error: "Local Claude CLI can only be used from localhost.",
    });

    let deviceCallCount = 0;
    const guardedDeviceRoute = withLocalDeviceGuard(
      async (_request: Request, context: { value: string }) => {
        deviceCallCount += 1;
        return Response.json({ value: context.value });
      },
    );
    const allowedDeviceRoute = await guardedDeviceRoute(
      localRequest("/api/settings"),
      { value: "allowed" },
    );
    assert.equal(allowedDeviceRoute.status, 200);
    assert.deepEqual(await json(allowedDeviceRoute), { value: "allowed" });

    const blockedDeviceRoute = await guardedDeviceRoute(
      nonLocalRequest("/api/settings"),
      { value: "blocked" },
    );
    assert.equal(blockedDeviceRoute.status, 403);
    assert.equal(deviceCallCount, 1);
    const crossOriginDeviceRoute = await guardedDeviceRoute(
      localRequest("/api/settings", {
        method: "POST", headers: { origin: "https://attacker.example" }, body: "{",
      }),
      { value: "must not run" },
    );
    assert.equal(crossOriginDeviceRoute.status, 403);
    assert.equal(deviceCallCount, 1, "reject browser requests before entering the handler");

    let cliCallCount = 0;
    const guardedCliRoute = withLocalCliGuard(async () => {
      cliCallCount += 1;
      return Response.json({ ok: true });
    });
    const blockedCliRoute = await guardedCliRoute(
      nonLocalRequest("/api/settings/claude-cli"),
    );
    assert.equal(blockedCliRoute.status, 403);
    assert.equal(cliCallCount, 0);
    const crossOriginCliRoute = await guardedCliRoute(localRequest("/api/settings/claude-cli", {
      method: "POST", headers: { "sec-fetch-site": "cross-site" }, body: "{",
    }));
    assert.equal(crossOriginCliRoute.status, 403);
    assert.equal(cliCallCount, 0, "reject cross-site requests before any CLI action");
  });

  await withEnv({ NODE_ENV: "production", VERCEL: undefined }, async () => {
    const deviceResponse = forbidNonLocalDeviceRequest(
      localRequest("/api/settings"),
    );
    assert.equal(deviceResponse?.status, 403);
    assert.deepEqual(await json(deviceResponse), {
      error: "Local device access is disabled in production mode.",
    });

    const cliResponse = forbidNonLocalCliRequest(
      localRequest("/api/settings/claude-cli"),
    );
    assert.equal(cliResponse?.status, 403);
    assert.deepEqual(await json(cliResponse), {
      error: "Local Claude CLI is disabled in production mode.",
    });
  });

  await withEnv({ NODE_ENV: "development", VERCEL: "1" }, async () => {
    const deviceResponse = forbidNonLocalDeviceRequest(
      localRequest("/api/settings"),
    );
    assert.equal(deviceResponse?.status, 403);
    assert.deepEqual(await json(deviceResponse), {
      error: "Local device access is disabled on hosted deployments.",
    });

    const cliResponse = forbidNonLocalCliRequest(
      localRequest("/api/settings/claude-cli"),
    );
    assert.equal(cliResponse?.status, 403);
    assert.deepEqual(await json(cliResponse), {
      error: "Local Claude CLI is disabled on hosted deployments.",
    });
  });
}

main()
  .then(() => {
    console.log("Local access helper tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
