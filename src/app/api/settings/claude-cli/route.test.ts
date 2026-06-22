import assert from "node:assert/strict";
import { createClaudeCliRouteHandlers } from "./handlers";
import type { ClaudeProfileSelectionInput } from "@/lib/claude/discovery";
import type { ClaudeCliStatus } from "@/lib/rag/claude-cli-status";
import {
  jsonRequest,
  localRequest,
  nonLocalRequest,
} from "@/lib/test-utils/request";

const selectedProfile: ClaudeCliStatus["selectedProfile"] = {
  id: "default",
  label: "Default profile",
  source: "default",
  displayPath: "~\\.claude",
  selected: true,
  exists: true,
  auth: {
    checked: true,
    loggedIn: true,
    method: "Claude subscription",
    error: null,
  },
};

function statusPayload(): ClaudeCliStatus {
  return {
    provider: "claude_code_cli",
    enabled: true,
    cliPath: "claude",
    configuredCliPath: "auto",
    cliPathSource: "path",
    loginCommand: "claude-login",
    loginCommandSource: "path",
    loginHelperAvailable: true,
    canOpenLogin: true,
    configDirConfigured: false,
    installed: true,
    version: "1.0.0",
    profiles: [selectedProfile],
    selectedProfile,
    selectedProfileFingerprint: "fingerprint",
    lastCliSmokeTest: null,
    auth: selectedProfile.auth,
  };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  let profileSelectionSeen: ClaudeProfileSelectionInput | undefined;
  let launchCalled = false;
  const handlers = createClaudeCliRouteHandlers({
    getClaudeCliStatus: async () => statusPayload(),
    launchClaudeLogin: async (selection) => {
      launchCalled = true;
      profileSelectionSeen = selection;
      return {
        ok: true,
        loginCommand: "claude-login",
        mode: "helper",
      };
    },
  });

  const getResponse = await handlers.GET(
    localRequest("/api/settings/claude-cli"),
  );
  assert.equal(getResponse.status, 200);
  const getPayload = await readJson(getResponse);
  assert.equal(getPayload.loginCommand, "claude-login");
  assert.equal(getPayload.installed, true);

  const postResponse = await handlers.POST(
    jsonRequest("/api/settings/claude-cli", {
      profileSelection: {
        manualConfigDir: "~\\.claude-profiles\\work",
      },
    }),
  );
  assert.equal(postResponse.status, 200);
  assert.equal(launchCalled, true);
  assert.deepEqual(profileSelectionSeen, {
    manualConfigDir: "~\\.claude-profiles\\work",
  });
  assert.deepEqual(await readJson(postResponse), {
    ok: true,
    loginCommand: "claude-login",
    mode: "helper",
  });

  launchCalled = false;
  const forbidden = await handlers.POST(
    nonLocalRequest("/api/settings/claude-cli", { method: "POST" }),
  );
  assert.equal(forbidden.status, 403);
  assert.equal(launchCalled, false);
  assert.match(
    String((await readJson(forbidden)).error),
    /localhost|production|hosted/i,
  );

  const failingHandlers = createClaudeCliRouteHandlers({
    launchClaudeLogin: async () => {
      const sampleEmail = ["owner", "example.com"].join("@");
      const sampleApiKey = ["sk-ant", "private-test-value"].join("-");
      const sampleAuthPath = ["C:", "Users", "Example", ".claude", "oauth.json"]
        .join("\\");
      throw new Error(
        `Account: ${sampleEmail} ${sampleApiKey} ${sampleAuthPath}`,
      );
    },
  });
  const failure = await failingHandlers.POST(
    jsonRequest("/api/settings/claude-cli", {}),
  );
  assert.equal(failure.status, 400);
  const error = String((await readJson(failure)).error);
  assert.equal(error.includes("owner@example.com"), false);
  assert.equal(error.includes(["sk-ant", "private-test-value"].join("-")), false);
  assert.equal(error.includes("C:\\Users\\"), false);
  assert.equal(error.toLowerCase().includes("oauth.json"), false);

  const unknownHandlers = createClaudeCliRouteHandlers({
    launchClaudeLogin: async () => {
      throw "string failure";
    },
  });
  const unknownFailure = await unknownHandlers.POST(
    jsonRequest("/api/settings/claude-cli", {}),
  );
  assert.equal(unknownFailure.status, 400);
  assert.equal((await readJson(unknownFailure)).error, "Unknown error");

  console.log("Claude CLI settings route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
