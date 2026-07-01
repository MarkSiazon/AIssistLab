import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";

const unsafeApiKey = "sk-ant-private-settings-value";
const unsafeGenericKey = "sk-general-provider-secret-value";
const unsafeEmail = "owner@example.invalid";
const unsafeAuthPath = "C:\\Users\\Example\\.claude\\oauth.json";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function withEnvFileBackup(fn: () => Promise<void>): Promise<void> {
  const env = await import("@/lib/settings/env");
  const original = await fs.readFile(env.ENV_PATH, "utf8").catch(() => null);

  try {
    await fn();
  } finally {
    if (original === null) {
      await fs.rm(env.ENV_PATH, { force: true });
    } else {
      await fs.writeFile(env.ENV_PATH, original, "utf8");
    }
  }
}

function assertNoUnsafeSettingsPayload(payload: unknown): void {
  const raw = JSON.stringify(payload);
  assert.doesNotMatch(raw, new RegExp(escapeRegExp(unsafeApiKey)));
  assert.doesNotMatch(raw, new RegExp(escapeRegExp(unsafeGenericKey)));
  assert.doesNotMatch(raw, new RegExp(unsafeEmail.replace(".", "\\.")));
  assert.doesNotMatch(raw, /oauth\.json/i);
  assert.doesNotMatch(raw, /C:\\Users\\/i);
}

async function main(): Promise<void> {
  await withEnvFileBackup(async () => {
    const route = await import("./route");
    const env = await import("@/lib/settings/env");

    await env.writeEnvFile(
      [
        `ANTHROPIC_API_KEY=${unsafeApiKey}`,
        `OPENROUTER_API_KEY=${unsafeGenericKey}`,
        `OWNER_EMAIL=${unsafeEmail}`,
        `CLAUDE_CONFIG_DIR=${unsafeAuthPath}`,
        "LLM_PROVIDER=anthropic_api",
      ].join("\n"),
    );

    const forbidden = await route.GET(nonLocalRequest("/api/settings"));
    assert.equal(forbidden.status, 403);

    const loaded = await route.GET(localRequest("/api/settings"));
    assert.equal(loaded.status, 200);
    const loadedPayload = await loaded.json();
    assert.equal(loadedPayload.path, ".env.local");
    assert.equal(loadedPayload.parsed.ANTHROPIC_API_KEY, env.REDACTED_ENV_VALUE);
    assert.equal(loadedPayload.parsed.OPENROUTER_API_KEY, env.REDACTED_ENV_VALUE);
    assert.equal(loadedPayload.parsed.OWNER_EMAIL, env.REDACTED_ENV_VALUE);
    assert.equal(loadedPayload.parsed.CLAUDE_CONFIG_DIR, env.REDACTED_ENV_VALUE);
    assertNoUnsafeSettingsPayload(loadedPayload);

    const saved = await route.POST(
      localRequest("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vars: {
            ANTHROPIC_API_KEY: env.REDACTED_ENV_VALUE,
            OPENROUTER_API_KEY: env.REDACTED_ENV_VALUE,
            LLM_PROVIDER: "claude_code_cli",
          },
          claudeProfileSelection: { profileId: "default" },
        }),
      }),
    );
    assert.equal(saved.status, 200);
    const savedPayload = await saved.json();
    assertNoUnsafeSettingsPayload(savedPayload);

    const privateEnv = await env.readEnvFile();
    assert.equal(privateEnv.parsed.ANTHROPIC_API_KEY, unsafeApiKey);
    assert.equal(privateEnv.parsed.OPENROUTER_API_KEY, unsafeGenericKey);
    assert.equal(privateEnv.parsed.LLM_PROVIDER, "claude_code_cli");
  });

  console.log("Settings route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
