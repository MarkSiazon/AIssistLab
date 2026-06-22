import assert from "node:assert/strict";
import { createClaudeCliTestRouteHandlers } from "./handlers";
import type { ClaudeProfileSelectionInput } from "@/lib/claude/discovery";
import {
  jsonRequest,
  nonLocalRequest,
} from "@/lib/test-utils/request";

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  let profileSelectionSeen: ClaudeProfileSelectionInput | undefined;
  let testCalled = false;
  const handlers = createClaudeCliTestRouteHandlers({
    testClaudeCli: async (selection) => {
      testCalled = true;
      profileSelectionSeen = selection;
      return {
        checked: true,
        ok: true,
        output: "OK",
        error: null,
        provider: "claude_code_cli",
        profileId: "default",
        configFingerprint: "fingerprint",
      };
    },
  });

  const success = await handlers.POST(
    jsonRequest("/api/settings/claude-cli/test", {
      profileSelection: { profileId: "default" },
    }),
  );
  assert.equal(success.status, 200);
  assert.equal(testCalled, true);
  assert.deepEqual(profileSelectionSeen, { profileId: "default" });
  assert.deepEqual(await readJson(success), {
    checked: true,
    ok: true,
    output: "OK",
    error: null,
    provider: "claude_code_cli",
    profileId: "default",
    configFingerprint: "fingerprint",
  });

  testCalled = false;
  const forbidden = await handlers.POST(
    nonLocalRequest("/api/settings/claude-cli/test", { method: "POST" }),
  );
  assert.equal(forbidden.status, 403);
  assert.equal(testCalled, false);

  const failingHandlers = createClaudeCliTestRouteHandlers({
    testClaudeCli: async () => {
      const sampleEmail = ["owner", "example.com"].join("@");
      const sampleApiKey = ["sk", "ant", "private-test-value"].join("-");
      const sampleAuthFile = ["oauth", "json"].join(".");
      const sampleAuthPath = [
        "C:",
        "Users",
        "Example",
        ".claude",
        sampleAuthFile,
      ].join("\\");
      throw new Error(
        `Account: ${sampleEmail} ${sampleApiKey} ${sampleAuthPath}`,
      );
    },
  });
  const failure = await failingHandlers.POST(
    jsonRequest("/api/settings/claude-cli/test", {}),
  );
  assert.equal(failure.status, 400);
  const failurePayload = await readJson(failure);
  assert.equal(failurePayload.checked, true);
  assert.equal(failurePayload.ok, false);
  assert.equal(failurePayload.output, null);
  const error = String(failurePayload.error);
  assert.equal(error.includes(["owner", "example.com"].join("@")), false);
  assert.equal(error.includes(["sk", "ant", "private-test-value"].join("-")), false);
  assert.equal(error.includes(["C:", "Users"].join("\\")), false);
  assert.equal(error.toLowerCase().includes(["oauth", "json"].join(".")), false);

  const unknownHandlers = createClaudeCliTestRouteHandlers({
    testClaudeCli: async () => {
      throw "string failure";
    },
  });
  const unknownFailure = await unknownHandlers.POST(
    jsonRequest("/api/settings/claude-cli/test", {}),
  );
  assert.equal(unknownFailure.status, 400);
  assert.deepEqual(await readJson(unknownFailure), {
    checked: true,
    ok: false,
    output: null,
    error: "Unknown error",
  });

  console.log("Claude CLI test route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
