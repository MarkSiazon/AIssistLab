import assert from "node:assert/strict";
import { getSettingsExtraFieldRows } from "./settings-extra-fields-panel";

const rows = getSettingsExtraFieldRows({
  extraFields: {
    CUSTOM_ONE: "alpha",
    CUSTOM_TWO: "beta",
  },
});

assert.deepEqual(rows, [
  {
    index: 0,
    key: "CUSTOM_ONE",
    value: "alpha",
    keyInputId: "settings-extra-key-0",
    valueInputId: "settings-extra-value-0",
    removeLabel: "Remove additional variable CUSTOM_ONE",
  },
  {
    index: 1,
    key: "CUSTOM_TWO",
    value: "beta",
    keyInputId: "settings-extra-key-1",
    valueInputId: "settings-extra-value-1",
    removeLabel: "Remove additional variable CUSTOM_TWO",
  },
]);

const unnamedRows = getSettingsExtraFieldRows({
  extraFields: {
    "": "",
  },
});

assert.equal(unnamedRows[0].removeLabel, "Remove additional variable 1");

console.log("Settings extra fields panel helper tests passed");
