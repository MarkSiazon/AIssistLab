import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { withEnv, withTempCwd } from "@/lib/test-utils/env";

async function main(): Promise<void> {
  const apiKeyPrefix = ["sk", "ant"].join("-");
  const processApiKey = `${apiKeyPrefix}-process-test-value`;
  const staleProcessApiKey = `${apiKeyPrefix}-stale-process-value`;
  const sensitiveProfileSegment = `${apiKeyPrefix}-private`;
  const secretApiKey = `${apiKeyPrefix}-runtime-private-value`;

  await withTempCwd("runtime-llm-settings-", async (tempRoot) => {
    await withEnv(
      {
        LLM_PROVIDER: "anthropic_api",
        ENABLE_LOCAL_CLAUDE_CLI: "false",
        CLAUDE_CLI_PATH: "auto",
        CLAUDE_LOGIN_COMMAND: "auto",
        CLAUDE_CONFIG_DIR: undefined,
        CLAUDE_CLI_TIMEOUT_MS: undefined,
        ANTHROPIC_API_KEY: processApiKey,
      },
      async () => {
        const runtime = await import("./runtime-config");
        runtime.clearRuntimeProviderSettings();

        const fallback = runtime.getActiveRuntimeProviderStatus();
        assert.deepEqual(fallback, {
          provider: "anthropic_api",
          claudeCliEnabled: false,
          configDirConfigured: false,
          source: "process",
        });
        assert.equal(
          runtime.getRuntimeProviderValue("ANTHROPIC_API_KEY"),
          processApiKey,
        );

        process.env.CLAUDE_CLI_PATH = "C:\\stale\\claude.exe";
        process.env.ANTHROPIC_API_KEY = staleProcessApiKey;
        const partialApplied = runtime.applyRuntimeProviderSettings({
          LLM_PROVIDER: "claude_code_cli",
        });

        assert.deepEqual(partialApplied, {
          provider: "claude_code_cli",
          claudeCliEnabled: false,
          configDirConfigured: false,
          source: "runtime",
        });
        assert.equal(runtime.getRuntimeProviderValue("CLAUDE_CLI_PATH"), "");
        assert.equal(runtime.getRuntimeProviderValue("ANTHROPIC_API_KEY"), "");

        runtime.clearRuntimeProviderSettings();

        const sensitiveConfigDir = path.join(
          tempRoot,
          "home",
          ".claude-profiles",
          [
            "owner",
            "example.invalid",
            "ExampleCorp",
            sensitiveProfileSegment,
          ].join("-"),
        );
        const applied = runtime.applyRuntimeProviderSettings({
          LLM_PROVIDER: "claude_code_cli",
          ENABLE_LOCAL_CLAUDE_CLI: "true",
          CLAUDE_CLI_PATH: "auto",
          CLAUDE_LOGIN_COMMAND: "auto",
          CLAUDE_CONFIG_DIR: sensitiveConfigDir,
          CLAUDE_CLI_TIMEOUT_MS: "60000",
          ANTHROPIC_API_KEY: secretApiKey,
          WORKSPACE_ROOT: "ignored-by-runtime-config",
        });

        assert.deepEqual(applied, {
          provider: "claude_code_cli",
          claudeCliEnabled: true,
          configDirConfigured: true,
          source: "runtime",
        });
        assert.equal(
          runtime.getRuntimeProviderValue("ANTHROPIC_API_KEY"),
          secretApiKey,
        );
        assert.equal(
          runtime.getRuntimeProviderValue("CLAUDE_CONFIG_DIR"),
          sensitiveConfigDir,
        );
        assert.equal(runtime.getRuntimeProviderValue("WORKSPACE_ROOT"), undefined);

        const publicJson = JSON.stringify(runtime.getActiveRuntimeProviderStatus());
        assert.equal(publicJson.includes(secretApiKey), false);
        assert.equal(publicJson.includes(sensitiveConfigDir), false);
        assert.doesNotMatch(publicJson, /owner@example\.invalid/i);
        assert.doesNotMatch(publicJson, /ExampleCorp/i);
        assert.doesNotMatch(publicJson, /sk-ant-private/i);

        const cacheRaw = await fs.readFile(
          path.join(tempRoot, ".next", "cache", "runtime-provider-settings.json"),
          "utf-8",
        );
        const cacheJson = JSON.parse(cacheRaw) as {
          values?: unknown;
          valueFingerprints?: unknown;
        };
        assert.equal(cacheJson.values, undefined);
        assert.equal(typeof cacheJson.valueFingerprints, "object");
        assert.doesNotMatch(cacheRaw, new RegExp(secretApiKey));
        assert.doesNotMatch(cacheRaw, /ExampleCorp/i);
        assert.doesNotMatch(cacheRaw, /example\.invalid/i);
        assert.doesNotMatch(cacheRaw, /sk-ant-private/i);
        assert.doesNotMatch(cacheRaw, /\.claude-profiles/i);

        const providerEnv = runtime.getActiveProviderRuntimeEnv();
        assert.equal(providerEnv.LLM_PROVIDER, "claude_code_cli");
        assert.equal(providerEnv.ENABLE_LOCAL_CLAUDE_CLI, "true");
        assert.equal(providerEnv.WORKSPACE_ROOT, undefined);

        const { buildClaudeCliEnvForCommand } = await import("../rag/llm-config");
        const cliEnv = buildClaudeCliEnvForCommand(sensitiveConfigDir);
        assert.equal(cliEnv.ANTHROPIC_API_KEY, undefined);
        assert.equal(cliEnv.CLAUDE_CONFIG_DIR, sensitiveConfigDir);
      },
    );
  });
}

main()
  .then(() => {
    console.log("Runtime LLM settings tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
