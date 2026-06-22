import assert from "node:assert/strict";
import {
  buildSettingsProfileSelectionPayload,
  getSettingsManualConfigDir,
  getSettingsProfileSelectionKey,
  isSettingsProfileActionDisabled,
} from "./settings-profile-selection";

function main() {
  const fields = { CLAUDE_CONFIG_DIR: "~/.config/profiles/default" };

  assert.equal(
    getSettingsManualConfigDir({
      selection: { profileId: "manual", manualConfigDir: "" },
      fields,
    }),
    "~/.config/profiles/default",
    "manual config dir should fall back to the saved field value",
  );

  assert.equal(
    getSettingsManualConfigDir({
      selection: {
        profileId: "manual",
        manualConfigDir: "~/.config/profiles/work",
      },
      fields,
    }),
    "~/.config/profiles/work",
    "manual config dir should prefer the active unsaved selection",
  );

  assert.equal(
    getSettingsProfileSelectionKey({
      selection: {
        profileId: "manual",
        manualConfigDir: "~/.config/profiles/work",
      },
      fields,
    }),
    "manual:~/.config/profiles/work",
    "manual profile keys should include the selected manual path",
  );

  assert.equal(
    getSettingsProfileSelectionKey({
      selection: { profileId: "profile-123", manualConfigDir: "" },
      fields,
    }),
    "profile:profile-123",
    "discovered profile keys should be based on the profile id only",
  );

  assert.deepEqual(
    buildSettingsProfileSelectionPayload({
      selection: { profileId: "manual", manualConfigDir: "" },
      fields,
      fallbackProfileId: "default",
    }),
    { manualConfigDir: "~/.config/profiles/default" },
    "manual payload should send the resolved manual config dir",
  );

  assert.deepEqual(
    buildSettingsProfileSelectionPayload({
      selection: { profileId: "profile-123", manualConfigDir: "" },
      fields,
      fallbackProfileId: "default",
    }),
    { profileId: "profile-123" },
    "profile payload should send the selected public profile id",
  );

  assert.deepEqual(
    buildSettingsProfileSelectionPayload({
      selection: { profileId: "", manualConfigDir: "" },
      fields,
      fallbackProfileId: "default",
    }),
    { profileId: "default" },
    "empty profile selection should fall back to the server-selected profile id",
  );

  assert.equal(
    isSettingsProfileActionDisabled({
      selection: { profileId: "manual", manualConfigDir: "" },
      fields: {},
    }),
    true,
    "manual profile actions should be disabled until a path exists",
  );

  assert.equal(
    isSettingsProfileActionDisabled({
      selection: { profileId: "manual", manualConfigDir: "" },
      fields,
    }),
    false,
    "manual profile actions should be enabled when the saved field supplies a path",
  );

  assert.equal(
    isSettingsProfileActionDisabled({
      selection: { profileId: "profile-123", manualConfigDir: "" },
      fields: {},
    }),
    false,
    "discovered/default profile actions should not require a manual path",
  );

  console.log("Settings profile selection helper tests passed");
}

main();
