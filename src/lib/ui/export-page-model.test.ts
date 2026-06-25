import assert from "node:assert/strict";
import {
  buildExportBundleStats,
  buildExportReadinessMetrics,
  buildExportReadinessStatus,
  buildPrimaryDownloadLabel,
  readinessCopy,
  type ReleaseReadinessResponse,
} from "./export-page-model";

const readySummary: ReleaseReadinessResponse["summary"] = {
  status: "ready",
  score: 96,
  topAction: null,
  canChat: true,
  canExportDiagnostics: true,
};

assert.equal(
  readinessCopy(readySummary, false),
  "Diagnostics export is available.",
);
assert.equal(
  readinessCopy(undefined, true),
  "Diagnostics readiness is unavailable in this server mode.",
);

assert.deepEqual(buildExportReadinessMetrics(readySummary, false), [
  { label: "Readiness", value: "Ready" },
  { label: "Chat", value: "Ready" },
  { label: "Diagnostics", value: "Available" },
]);

assert.deepEqual(buildExportReadinessStatus({
  readinessSummary: readySummary,
  readinessError: null,
}), {
  statusLabel: "Ready",
  scoreLabel: "96/100",
  statusColor: "var(--green)",
});

assert.deepEqual(buildExportBundleStats({
  skillCount: 3,
  scopeLabel: "2 selected",
  includeDiagnostics: true,
  readinessSummary: readySummary,
  readinessError: null,
}), [
  ["Available skills", "3"],
  ["Bundle scope", "2 selected"],
  ["Diagnostics", "Included"],
  ["Readiness", "Ready - 96/100"],
]);

assert.equal(
  buildPrimaryDownloadLabel({
    isLoading: false,
    skillCount: 4,
    includeDiagnostics: true,
  }),
  "Download All + Diagnostics",
);
assert.equal(
  buildPrimaryDownloadLabel({
    isLoading: false,
    skillCount: 0,
    includeDiagnostics: false,
  }),
  "Export Diagnostics",
);

console.log("Export page model tests passed");
