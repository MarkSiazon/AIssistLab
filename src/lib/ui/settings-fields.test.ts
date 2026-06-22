import assert from "node:assert/strict";
import {
  CLAUDE_CLI_FIELDS,
  CONFIG_SECTIONS,
  CORE_FIELDS,
  KNOWN_FIELDS,
  getDefaultSettingsFieldValues,
} from "./settings-fields";

const EXPECTED_CORE_KEYS = [
  "ANTHROPIC_API_KEY",
  "WORKSPACE_ROOT",
  "SKILLS_DIR",
  "NEXT_PUBLIC_APP_TITLE",
];

const EXPECTED_CLAUDE_CLI_KEYS = [
  "LLM_PROVIDER",
  "ENABLE_LOCAL_CLAUDE_CLI",
  "CLAUDE_CLI_PATH",
  "CLAUDE_LOGIN_COMMAND",
  "CLAUDE_CONFIG_DIR",
];

function main(): void {
  assert.deepEqual(
    CORE_FIELDS.map((field) => field.key),
    EXPECTED_CORE_KEYS,
  );
  assert.deepEqual(
    CLAUDE_CLI_FIELDS.map((field) => field.key),
    EXPECTED_CLAUDE_CLI_KEYS,
  );
  assert.deepEqual(
    KNOWN_FIELDS.map((field) => field.key),
    [...EXPECTED_CORE_KEYS, ...EXPECTED_CLAUDE_CLI_KEYS],
  );

  assert.deepEqual(
    CONFIG_SECTIONS.map((section) => section.title),
    ["Core Configuration", "Claude CLI"],
  );
  assert.deepEqual(CONFIG_SECTIONS[0].fields, CORE_FIELDS);
  assert.deepEqual(CONFIG_SECTIONS[1].fields, CLAUDE_CLI_FIELDS);

  assert.deepEqual(getDefaultSettingsFieldValues(), {
    LLM_PROVIDER: "anthropic_api",
    ENABLE_LOCAL_CLAUDE_CLI: "false",
    CLAUDE_CLI_PATH: "auto",
    CLAUDE_LOGIN_COMMAND: "auto",
  });

  assert.equal(
    new Set(KNOWN_FIELDS.map((field) => field.key)).size,
    KNOWN_FIELDS.length,
  );
}

try {
  main();
  console.log("Settings field definition tests passed");
} catch (error) {
  console.error(error);
  process.exit(1);
}
