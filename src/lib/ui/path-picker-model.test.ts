import assert from "node:assert/strict";
import {
  compactPath,
  isAbsolutePathValue,
  normalizeInputPath,
  splitBreadcrumbs,
} from "./path-picker-model";

assert.equal(normalizeInputPath(' "C:\\Work\\Skills" '), "C:\\Work\\Skills");
assert.equal(normalizeInputPath("'~/skills'"), "~/skills");
assert.equal(isAbsolutePathValue("C:\\Work\\Skills"), true);
assert.equal(isAbsolutePathValue("C:/Work/Skills"), true);
assert.equal(isAbsolutePathValue("\\\\server\\share\\skills"), true);
assert.equal(isAbsolutePathValue("/workspace/skills"), true);
assert.equal(isAbsolutePathValue(".claude/skills"), false);
assert.equal(isAbsolutePathValue("skills"), false);

assert.deepEqual(splitBreadcrumbs("C:\\Work\\Skills"), [
  { label: "C:\\", path: "C:\\" },
  { label: "Work", path: "C:\\Work" },
  { label: "Skills", path: "C:\\Work\\Skills" },
]);

assert.deepEqual(splitBreadcrumbs("/workspace/skills"), [
  { label: "/", path: "/" },
  { label: "workspace", path: "/workspace" },
  { label: "skills", path: "/workspace/skills" },
]);

assert.equal(
  compactPath("C:\\Users\\Shared\\Projects\\SkillWorkshop\\Workspace\\skills"),
  "C:\\...\\Workspace\\skills",
);

console.log("Path picker model tests passed");
