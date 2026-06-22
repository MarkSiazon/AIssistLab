import assert from "node:assert/strict";
import {
  clearGuidedDraftFromStorage,
  GUIDED_DRAFT_STORAGE_KEY,
  readGuidedDraftFromStorage,
  writeGuidedDraftToStorage,
  type GuidedDraftStorage,
} from "./guided-draft-storage";

function createStorage(): GuidedDraftStorage & {
  values: Map<string, string>;
} {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

const storage = createStorage();
assert.equal(writeGuidedDraftToStorage(storage, { name: "draft" }), true);
assert.deepEqual(readGuidedDraftFromStorage(storage), { name: "draft" });
clearGuidedDraftFromStorage(storage);
assert.equal(storage.values.has(GUIDED_DRAFT_STORAGE_KEY), false);

storage.values.set(GUIDED_DRAFT_STORAGE_KEY, "{");
assert.equal(readGuidedDraftFromStorage(storage), null);

const blockedStorage: GuidedDraftStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};
assert.equal(readGuidedDraftFromStorage(blockedStorage), null);
assert.equal(writeGuidedDraftToStorage(blockedStorage, { name: "draft" }), false);
assert.doesNotThrow(() => clearGuidedDraftFromStorage(blockedStorage));

console.log("Guided draft storage tests passed");
