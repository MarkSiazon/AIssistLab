import assert from "node:assert/strict";
import {
  isSettingsPathValidationFieldType,
  resolveSettingsPathForValidation,
  settingsPathStateForValidationResult,
} from "./settings-path-validation";

function main() {
  assert.equal(isSettingsPathValidationFieldType("path"), true);
  assert.equal(isSettingsPathValidationFieldType("profile"), true);
  assert.equal(isSettingsPathValidationFieldType("relpath"), true);
  assert.equal(isSettingsPathValidationFieldType("text"), false);
  assert.equal(isSettingsPathValidationFieldType("select"), false);
  assert.equal(isSettingsPathValidationFieldType("password"), false);

  assert.equal(
    resolveSettingsPathForValidation({
      value: "\\.claude/skills",
      type: "relpath",
      workspaceRoot: "C:\\workspace\\",
    }),
    "C:\\workspace\\.claude/skills",
    "relative skills paths should resolve against WORKSPACE_ROOT using current Windows join behavior",
  );

  assert.equal(
    resolveSettingsPathForValidation({
      value: ".claude/skills",
      type: "relpath",
      workspaceRoot: "",
    }),
    ".claude/skills",
    "relative path validation should leave values unchanged when WORKSPACE_ROOT is unavailable",
  );

  assert.equal(
    resolveSettingsPathForValidation({
      value: "C:\\workspace",
      type: "path",
      workspaceRoot: "D:\\other",
    }),
    "C:\\workspace",
    "absolute path field validation should not use WORKSPACE_ROOT",
  );

  assert.equal(
    settingsPathStateForValidationResult({
      exists: true,
      isDirectory: true,
    }),
    "ok",
    "existing directories should validate as ok",
  );

  assert.equal(
    settingsPathStateForValidationResult({
      exists: true,
      isDirectory: false,
    }),
    "error",
    "existing files should not validate as directory paths",
  );

  assert.equal(
    settingsPathStateForValidationResult({
      exists: false,
      isDirectory: false,
    }),
    "error",
    "missing paths should validate as errors",
  );

  console.log("Settings path validation helper tests passed");
}

main();
