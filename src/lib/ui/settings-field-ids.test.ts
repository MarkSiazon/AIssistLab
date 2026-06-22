import assert from "node:assert/strict";
import {
  settingsFieldId,
  settingsManualPathInputId,
} from "./settings-field-ids";

async function main() {
  const profileSelectId = settingsFieldId("CLAUDE_CONFIG_DIR");
  const manualInputId = settingsManualPathInputId("CLAUDE_CONFIG_DIR");

  assert.equal(profileSelectId, "settings-claude-config-dir");
  assert.equal(manualInputId, "settings-claude-config-dir-manual-path");
  assert.notEqual(
    manualInputId,
    profileSelectId,
    "manual profile path input must not reuse the profile select id",
  );
  assert.equal(settingsFieldId("WORKSPACE_ROOT"), "settings-workspace-root");

  console.log("Settings field id tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
