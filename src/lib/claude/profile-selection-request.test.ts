import assert from "node:assert/strict";
import { readClaudeProfileSelectionRequest } from "./profile-selection-request";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/settings/claude-cli", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function main(): Promise<void> {
  assert.deepEqual(
    await readClaudeProfileSelectionRequest(
      jsonRequest({ profileSelection: { profileId: "default" } }),
    ),
    { profileId: "default" },
    "nested profileSelection should be used directly",
  );

  assert.deepEqual(
    await readClaudeProfileSelectionRequest(
      jsonRequest({
        profileId: "manual",
        manualConfigDir: "~/.claude-profiles/work",
      }),
    ),
    {
      profileId: "manual",
      manualConfigDir: "~/.claude-profiles/work",
    },
    "legacy flat profile selection fields should still be accepted",
  );

  assert.deepEqual(
    await readClaudeProfileSelectionRequest(
      new Request("http://localhost/api/settings/claude-cli", {
        method: "POST",
        body: "{",
      }),
    ),
    { profileId: undefined, manualConfigDir: undefined },
    "malformed request bodies should fall back to an empty selection",
  );

  assert.deepEqual(
    await readClaudeProfileSelectionRequest(jsonRequest(["manual"])),
    { profileId: undefined, manualConfigDir: undefined },
    "non-object request bodies should fall back to an empty selection",
  );

  assert.deepEqual(
    await readClaudeProfileSelectionRequest(
      jsonRequest({
        profileSelection: {
          profileId: 123,
          manualConfigDir: "~/.claude-profiles/work",
        },
      }),
    ),
    {
      manualConfigDir: "~/.claude-profiles/work",
    },
    "non-string profile fields should be ignored",
  );

  console.log("Claude profile selection request tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
