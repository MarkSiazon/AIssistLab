import assert from "node:assert/strict";
import {
  applySettingsFieldValues,
  isSettingsSnapshotDirty,
  removeSettingsExtraField,
  splitSettingsEnvFields,
  updateSettingsExtraField,
  type SettingsSnapshot,
} from "./env-fields";

const knownFields = [
  { key: "WORKSPACE_ROOT" },
  { key: "SKILLS_DIR", defaultValue: ".claude/skills" },
  { key: "LLM_PROVIDER", defaultValue: "anthropic_api" },
];

const split = splitSettingsEnvFields({
  parsed: {
    WORKSPACE_ROOT: "C:\\workspace",
    CUSTOM_VALUE: "enabled",
  },
  knownFields,
});

assert.deepEqual(split, {
  fields: {
    WORKSPACE_ROOT: "C:\\workspace",
    SKILLS_DIR: ".claude/skills",
    LLM_PROVIDER: "anthropic_api",
  },
  extraFields: {
    CUSTOM_VALUE: "enabled",
  },
});

const snapshot: SettingsSnapshot = {
  fields: {
    WORKSPACE_ROOT: "C:\\workspace",
  },
  extraFields: {
    CUSTOM_VALUE: "enabled",
  },
  rawText: "WORKSPACE_ROOT=C:\\workspace",
};

assert.equal(
  isSettingsSnapshotDirty({
    snapshot,
    fields: {
      WORKSPACE_ROOT: "C:\\workspace",
    },
    extraFields: {
      CUSTOM_VALUE: "enabled",
    },
    rawText: "WORKSPACE_ROOT=C:\\workspace",
  }),
  false,
);

assert.equal(
  isSettingsSnapshotDirty({
    snapshot,
    fields: {
      WORKSPACE_ROOT: "C:\\next",
    },
    extraFields: {
      CUSTOM_VALUE: "enabled",
    },
    rawText: "WORKSPACE_ROOT=C:\\workspace",
  }),
  true,
);

assert.equal(
  isSettingsSnapshotDirty({
    snapshot: null,
    fields: {},
    extraFields: {},
    rawText: "",
  }),
  false,
);

assert.deepEqual(
  applySettingsFieldValues({
    fields: {
      WORKSPACE_ROOT: "C:\\old",
      SKILLS_DIR: ".claude/skills",
    },
    values: {
      WORKSPACE_ROOT: "C:\\next",
    },
  }),
  {
    WORKSPACE_ROOT: "C:\\next",
    SKILLS_DIR: ".claude/skills",
  },
);

assert.deepEqual(
  updateSettingsExtraField({
    extraFields: {
      CUSTOM_ONE: "enabled",
      CUSTOM_TWO: "kept",
    },
    oldKey: "CUSTOM_ONE",
    newKey: "CUSTOM_RENAMED",
    value: "updated",
  }),
  {
    CUSTOM_TWO: "kept",
    CUSTOM_RENAMED: "updated",
  },
);

assert.deepEqual(
  updateSettingsExtraField({
    extraFields: {
      CUSTOM_ONE: "enabled",
      CUSTOM_TWO: "kept",
    },
    oldKey: "CUSTOM_ONE",
    newKey: "",
    value: "ignored",
  }),
  {
    CUSTOM_TWO: "kept",
  },
);

assert.deepEqual(
  removeSettingsExtraField({
    extraFields: {
      CUSTOM_ONE: "enabled",
      CUSTOM_TWO: "kept",
    },
    key: "CUSTOM_ONE",
  }),
  {
    CUSTOM_TWO: "kept",
  },
);

console.log("Settings env field helper tests passed");
