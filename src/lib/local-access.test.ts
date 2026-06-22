import assert from "node:assert/strict";
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
  await withEnv({ VERCEL: undefined }, async () => {
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
