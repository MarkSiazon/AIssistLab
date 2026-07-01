import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { discoverClaudeProfileState } from "@/lib/claude/discovery";
import { withEnv, withTempCwd } from "@/lib/test-utils/env";
import { jsonRequest, localRequest, testRequest } from "@/lib/test-utils/request";

async function main(): Promise<void> {
  await withTempCwd("claude-profile-selection-", async (tempRoot) => {
    const fakeHome = path.join(tempRoot, "home");
    const sensitiveFolder = [
      "person",
      "example.com",
      "ExampleCorp",
      "sk-ant-private-test-value",
    ].join("-");
    await fs.mkdir(path.join(fakeHome, ".claude"), { recursive: true });
    await fs.mkdir(path.join(fakeHome, ".claude-profiles", sensitiveFolder), {
      recursive: true,
    });

    await withEnv({ HOME: fakeHome, USERPROFILE: fakeHome }, async () => {
      const state = await discoverClaudeProfileState({
        configuredConfigDir: "",
      });
      const targetProfile = state.profiles.find(
        (profile) => profile.source === "discovered",
      );
      assert.ok(targetProfile, "expected a discovered profile");
      assert.ok(targetProfile.id.startsWith("profile-"));
      assert.equal(JSON.stringify(targetProfile).includes(sensitiveFolder), false);
      assert.equal(JSON.stringify(targetProfile).includes("envValue"), false);

      const { POST } = await import("./route");
      const malformed = await POST(
        testRequest("/api/settings", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      );
      assert.equal(malformed.status, 400);
      assert.deepEqual(await malformed.json(), {
        error: "Provide either raw or vars",
      });

      const response = await POST(
        jsonRequest("/api/settings", {
          vars: {
            LLM_PROVIDER: "claude_code_cli",
            ENABLE_LOCAL_CLAUDE_CLI: "true",
            CLAUDE_CONFIG_DIR: "",
          },
          claudeProfileSelection: {
            profileId: targetProfile.id,
          },
        }),
      );

      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        parsed: Record<string, string>;
        runtimeApplied: boolean;
        activeRuntime: {
          provider: string;
          claudeCliEnabled: boolean;
          configDirConfigured: boolean;
          source: string;
        };
      };
      const expectedConfigDir = `~\\.claude-profiles\\${sensitiveFolder}`;
      assert.equal(payload.parsed.CLAUDE_CONFIG_DIR, "<redacted>");
      assert.equal(payload.runtimeApplied, true);
      assert.equal(JSON.stringify(payload).includes(sensitiveFolder), false);
      assert.deepEqual(payload.activeRuntime, {
        provider: "claude_code_cli",
        claudeCliEnabled: true,
        configDirConfigured: true,
        source: "runtime",
      });
      assert.equal(
        JSON.stringify(payload.activeRuntime).includes(sensitiveFolder),
        false,
      );

      const persistedEnv = await fs.readFile(
        path.join(tempRoot, ".env.local"),
        "utf-8",
      );
      assert.match(persistedEnv, /CLAUDE_CONFIG_DIR=/);
      assert.equal(persistedEnv.includes(expectedConfigDir), true);

      const { GET: runtimeGet } = await import("./runtime/route");
      const runtimeResponse = await runtimeGet(
        localRequest("/api/settings/runtime"),
      );
      assert.equal(runtimeResponse.status, 200);
      const runtimePayload = await runtimeResponse.json();
      assert.deepEqual(runtimePayload, payload.activeRuntime);
      assert.equal(JSON.stringify(runtimePayload).includes(sensitiveFolder), false);
    });
  });
}

main()
  .then(() => {
    console.log("Settings profile selection tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
