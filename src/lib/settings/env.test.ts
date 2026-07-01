import assert from "node:assert/strict";
import {
  REDACTED_ENV_VALUE,
  mergeRedactedEnvVars,
  mergeRedactedRawEnv,
  parseEnv,
  publicEnvFileFromRaw,
  serializeEnv,
} from "./env";

assert.deepEqual(parseEnv("A=1\n# comment\nB='two words'\nC=\"three words\"\n"), {
  A: "1",
  B: "two words",
  C: "three words",
});

assert.equal(serializeEnv({ A: "1", B: "two words" }), 'A=1\nB="two words"\n');

{
  const publicEnv = publicEnvFileFromRaw(
    [
      "ANTHROPIC_API_KEY=sk-ant-private-value",
      "GENERAL_TOKEN=sk-general-provider-secret-value",
      "CLAUDE_CONFIG_DIR=C:\\Users\\Example\\.claude-profiles\\work-profile",
      "WORKSPACE_ROOT=C:\\Projects\\PublicWorkspace",
      "OWNER_EMAIL=owner@example.invalid",
    ].join("\n"),
  );

  const raw = JSON.stringify(publicEnv);
  assert.equal(publicEnv.path, ".env.local");
  assert.equal(publicEnv.parsed.ANTHROPIC_API_KEY, REDACTED_ENV_VALUE);
  assert.equal(publicEnv.parsed.GENERAL_TOKEN, REDACTED_ENV_VALUE);
  assert.equal(publicEnv.parsed.CLAUDE_CONFIG_DIR, REDACTED_ENV_VALUE);
  assert.equal(publicEnv.parsed.OWNER_EMAIL, REDACTED_ENV_VALUE);
  assert.equal(publicEnv.parsed.WORKSPACE_ROOT, "C:\\Projects\\PublicWorkspace");
  assert.doesNotMatch(raw, /sk-ant-private-value/);
  assert.doesNotMatch(raw, /sk-general-provider-secret-value/);
  assert.doesNotMatch(raw, /owner@example\.invalid/);
  assert.doesNotMatch(raw, /work-profile/);
}

assert.deepEqual(
  mergeRedactedEnvVars(
    {
      ANTHROPIC_API_KEY: REDACTED_ENV_VALUE,
      LLM_PROVIDER: "claude_code_cli",
    },
    {
      ANTHROPIC_API_KEY: "sk-ant-existing-value",
      LLM_PROVIDER: "anthropic_api",
    },
  ),
  {
    ANTHROPIC_API_KEY: "sk-ant-existing-value",
    LLM_PROVIDER: "claude_code_cli",
  },
);

assert.equal(
  mergeRedactedRawEnv(
    [
      `ANTHROPIC_API_KEY=${REDACTED_ENV_VALUE}`,
      "LLM_PROVIDER=claude_code_cli",
    ].join("\n"),
    {
      ANTHROPIC_API_KEY: "sk-ant-existing-value",
      LLM_PROVIDER: "anthropic_api",
    },
  ),
  "ANTHROPIC_API_KEY=sk-ant-existing-value\nLLM_PROVIDER=claude_code_cli",
);

console.log("Settings env helper tests passed");
