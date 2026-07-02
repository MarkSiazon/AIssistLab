import assert from "node:assert/strict";
import {
  buildMockReleaseReadinessPayload,
  buildMockReleaseReadinessSection,
} from "./release.mjs";

const section = buildMockReleaseReadinessSection({
  id: "diagnostics",
  label: "Diagnostics",
  message: "Diagnostics export is available.",
  actionLabel: "Export Diagnostics",
  actionHref: "/export?diagnostics=true",
});

assert.deepEqual(section, {
  id: "diagnostics",
  label: "Diagnostics",
  status: "ready",
  message: "Diagnostics export is available.",
  actionLabel: "Export Diagnostics",
  actionHref: "/export?diagnostics=true",
});

const blockedSection = buildMockReleaseReadinessSection({
  id: "workspace",
  label: "Workspace",
  status: "blocked",
  message: "Workspace paths need review.",
});

assert.deepEqual(blockedSection, {
  id: "workspace",
  label: "Workspace",
  status: "blocked",
  message: "Workspace paths need review.",
});

const payload = buildMockReleaseReadinessPayload({
  status: "needs_action",
  score: 92,
  topAction: "Export diagnostics.",
  topActionLabel: "Open Export",
  topActionHref: "/export?diagnostics=true",
  canChat: false,
  sections: [section, blockedSection],
});

assert.equal(payload.schemaVersion, 1);
assert.equal(payload.generatedAt, "2026-06-12T04:00:00.000Z");
assert.deepEqual(payload.summary, {
  status: "needs_action",
  score: 92,
  topAction: "Export diagnostics.",
  topActionLabel: "Open Export",
  topActionHref: "/export?diagnostics=true",
  canChat: false,
  canExportDiagnostics: true,
});
assert.deepEqual(payload.sections, [section, blockedSection]);

console.log("Release mock helper tests passed");
