import assert from "node:assert/strict";
import {
  createManualExternalQaEvidence,
  formatManualExternalQaTimestamp,
  manualExternalQaCommand,
  manualExternalQaItems,
  manualExternalQaStatusLabel,
  parseManualExternalQaEvidence,
  readManualExternalQaEvidenceFromStorage,
  serializeManualExternalQaEvidence,
  summarizeManualExternalQaEvidence,
  updateManualExternalQaEvidence,
  writeManualExternalQaEvidenceToStorage,
} from "./manual-external-qa-panel";

const initialEvidence = createManualExternalQaEvidence();

assert.equal(initialEvidence.length, 3);
assert.deepEqual(
  initialEvidence.map((item) => item.id),
  manualExternalQaItems.map((item) => item.id),
);
assert.deepEqual(
  initialEvidence.map((item) => item.status),
  ["pending", "pending", "pending"],
);
assert.deepEqual(
  initialEvidence.map((item) => item.manualReason.length > 0),
  [true, true, true],
);

const checkedAt = "2026-06-22T04:00:00.000Z";
const passedEvidence = updateManualExternalQaEvidence(
  initialEvidence,
  "native-folder-picker",
  "passed",
  checkedAt,
);
assert.equal(passedEvidence[0]?.status, "passed");
assert.equal(passedEvidence[0]?.checkedAt, checkedAt);
assert.equal(initialEvidence[0]?.status, "pending");

const failedEvidence = updateManualExternalQaEvidence(
  passedEvidence,
  "claude-open-login",
  "failed",
  "2026-06-22T04:05:00.000Z",
);
assert.deepEqual(summarizeManualExternalQaEvidence(failedEvidence), {
  total: 3,
  passed: 1,
  failed: 1,
  pending: 1,
  statusLabel: "Needs review",
});

const resetEvidence = updateManualExternalQaEvidence(
  failedEvidence,
  "claude-open-login",
  "pending",
  "2026-06-22T04:06:00.000Z",
);
assert.equal(resetEvidence[1]?.status, "pending");
assert.equal(resetEvidence[1]?.checkedAt, null);

const serialized = serializeManualExternalQaEvidence(failedEvidence);
assert.deepEqual(
  parseManualExternalQaEvidence(serialized).map((item) => ({
    id: item.id,
    status: item.status,
    checkedAt: item.checkedAt,
  })),
  failedEvidence.map((item) => ({
    id: item.id,
    status: item.status,
    checkedAt: item.checkedAt,
  })),
);

assert.deepEqual(parseManualExternalQaEvidence("not json"), initialEvidence);
assert.equal(
  parseManualExternalQaEvidence(
    JSON.stringify([
      {
        id: "native-folder-picker",
        status: "unknown",
        checkedAt: checkedAt,
      },
      {
        id: "extra-item",
        status: "passed",
        checkedAt: checkedAt,
      },
    ]),
  )[0]?.status,
  "pending",
);

assert.deepEqual(
  summarizeManualExternalQaEvidence(
    manualExternalQaItems.map((item) => ({
      ...item,
      status: "passed" as const,
      checkedAt,
    })),
  ),
  {
    total: 3,
    passed: 3,
    failed: 0,
    pending: 0,
    statusLabel: "Complete",
  },
);

assert.equal(manualExternalQaStatusLabel("pending"), "Pending");
assert.equal(manualExternalQaStatusLabel("passed"), "Passed");
assert.equal(manualExternalQaStatusLabel("failed"), "Needs fix");
assert.equal(formatManualExternalQaTimestamp(null), "Not recorded");
assert.equal(formatManualExternalQaTimestamp("not a date"), "Not recorded");
assert.equal(manualExternalQaCommand, "npm run qa:manual");

const memoryStorage = new Map<string, string>();
const storage = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorage.set(key, value);
  },
};

assert.equal(writeManualExternalQaEvidenceToStorage(storage, failedEvidence), true);
assert.deepEqual(
  readManualExternalQaEvidenceFromStorage(storage).evidence.map((item) => ({
    id: item.id,
    status: item.status,
    checkedAt: item.checkedAt,
  })),
  failedEvidence.map((item) => ({
    id: item.id,
    status: item.status,
    checkedAt: item.checkedAt,
  })),
);
assert.equal(readManualExternalQaEvidenceFromStorage(storage).available, true);

const blockedStorage = {
  getItem: () => {
    throw new Error("storage blocked");
  },
  setItem: () => {
    throw new Error("storage blocked");
  },
};

assert.deepEqual(
  readManualExternalQaEvidenceFromStorage(blockedStorage),
  {
    evidence: initialEvidence,
    available: false,
  },
);
assert.equal(
  writeManualExternalQaEvidenceToStorage(blockedStorage, failedEvidence),
  false,
);

console.log("Manual external QA panel helper tests passed");
