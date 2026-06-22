import assert from "node:assert/strict";
import {
  skillEditorHref,
  skillExportHref,
  skillsZipExportHref,
} from "./skill-action-links";
import { isSafeInternalActionHref } from "./internal-action-href";

assert.equal(skillEditorHref("research-helper"), "/editor/research-helper");
assert.equal(
  skillEditorHref("name with spaces"),
  "/editor/name%20with%20spaces",
);

assert.equal(
  skillExportHref("research-helper"),
  "/api/export?skill=research-helper",
);
assert.equal(
  skillExportHref("name with spaces"),
  "/api/export?skill=name+with+spaces",
);

assert.equal(skillsZipExportHref(), "/api/export/zip");
assert.equal(
  skillsZipExportHref({ includeDiagnostics: true }),
  "/api/export/zip?diagnostics=true",
);
assert.equal(
  skillsZipExportHref({
    selectedSkills: ["alpha", "beta skill"],
    includeDiagnostics: true,
  }),
  "/api/export/zip?skill=alpha&skill=beta+skill&diagnostics=true",
);
assert.equal(
  skillsZipExportHref({
    selectedSkills: ["alpha,beta"],
  }),
  "/api/export/zip?skill=alpha%2Cbeta",
);

for (const href of [
  skillEditorHref("name with spaces"),
  skillExportHref("name with spaces"),
  skillExportHref("//example.com"),
  skillsZipExportHref({
    selectedSkills: ["alpha", "//example.com", "../escape"],
    includeDiagnostics: true,
  }),
]) {
  assert.equal(
    isSafeInternalActionHref(href),
    true,
    `${href} should remain a safe internal generated route`,
  );
}

assert.equal(
  isSafeInternalActionHref(skillEditorHref("../escape")),
  false,
  "Editor route helpers should not make traversal-shaped names safe for action navigation",
);

console.log("Skill action link tests passed");
