import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("scripts/smoke-local.mjs", "utf8");

assert.match(
  source,
  /async function locatorIsDisabled\(locator\)[\s\S]*?locator\s*\.\s*isDisabled\(\{\s*timeout:\s*1000\s*\}\)[\s\S]*?getAttribute\("aria-disabled",\s*\{\s*timeout:\s*1000\s*\}\)/,
  "smoke runner must centralize native and aria-disabled locator checks",
);

const directIsDisabledCalls = source.match(/\.isDisabled\(/g) ?? [];
assert.equal(
  directIsDisabledCalls.length,
  1,
  "smoke runner should use locatorIsDisabled instead of direct isDisabled calls",
);

assert.match(
  source,
  /button\.disabled\s*\|\|\s*button\.getAttribute\("aria-disabled"\)\s*===\s*"true"/,
  "label-based button lookup must ignore aria-disabled buttons",
);

assert.match(
  source,
  /rect\.height\s*<\s*44/,
  "interactive accessibility smoke must enforce 44px minimum target height",
);

assert.match(
  source,
  /rect\.width\s*<\s*44/,
  "interactive accessibility smoke must enforce 44px minimum target width",
);

assert.match(
  source,
  /expectText\(page,\s*"Manual QA Evidence"\)/,
  "settings smoke must verify the manual QA evidence panel is visible",
);

assert.match(
  source,
  /expectText\(page,\s*"npm run qa:manual"\)/,
  "settings smoke must verify the manual external QA command is visible",
);

assert.match(
  source,
  /clickButtonIn\(manualQaPanel,\s*"Mark Passed"\)/,
  "settings smoke must verify manual QA evidence can be marked passed",
);

assert.match(
  source,
  /clickButtonIn\(manualQaPanel,\s*"Needs Fix"\)/,
  "settings smoke must verify manual QA evidence can be marked failed",
);

assert.match(
  source,
  /clickButtonIn\(manualQaPanel,\s*"Reset"\)/,
  "settings smoke must verify manual QA evidence can be reset",
);

assert.match(
  source,
  /runSettingsManualQaBlockedStorageSmoke/,
  "local smoke must verify the manual QA evidence panel when browser storage is blocked",
);

assert.match(
  source,
  /Browser storage is unavailable, so evidence is kept in memory for this page only\./,
  "blocked-storage smoke must verify the storage fallback copy",
);

assert.match(
  source,
  /Enter a workspace profile name first\./,
  "settings smoke must verify workspace profile name validation",
);

assert.match(
  source,
  /Workspace profile is available in this tab, but browser storage is unavailable\./,
  "blocked-storage smoke must verify workspace profile persistence fallback copy",
);

assert.match(
  source,
  /runGuidedBlockedSessionStorageSmoke/,
  "local smoke must verify Guided Builder when browser session storage is blocked",
);

assert.match(
  source,
  /Browser storage is unavailable, so the draft cannot be handed off to the editor in this tab\./,
  "blocked-session-storage smoke must verify the guided handoff failure copy",
);

assert.match(
  source,
  /runMockedChatClipboardFailureSmoke/,
  "local smoke must verify chat copy failure handling",
);

assert.match(
  source,
  /Copy failed\. Select the message text manually\./,
  "chat clipboard failure smoke must verify the fallback copy",
);

assert.match(
  source,
  /Type the exact skill name to enable delete\./,
  "skills smoke must verify the delete confirmation starts blocked",
);

assert.match(
  source,
  /Typed name does not match smoke-imported-skill\./,
  "skills smoke must verify wrong delete confirmation text is blocked",
);

assert.match(
  source,
  /Delete confirm button should stay disabled until the exact skill name is typed/,
  "skills smoke must assert delete confirm remains disabled before exact confirmation",
);

assert.match(
  source,
  /runMockedSkillsImportDuplicateSmoke/,
  "local smoke must verify duplicate import controls",
);

assert.match(
  source,
  /All previewed skills are duplicates\. Choose Rename or Overwrite to import changes\./,
  "duplicate import smoke must verify skip-all duplicate blocker copy",
);

assert.match(
  source,
  /Duplicate import should not be applyable while skip would import nothing/,
  "duplicate import smoke must assert skip-all duplicate apply is disabled",
);

assert.match(
  source,
  /Rename duplicates and import 1/,
  "duplicate import smoke must verify the rename import action",
);

assert.match(
  source,
  /Overwrite import should stay disabled before typed confirmation/,
  "duplicate import smoke must assert overwrite requires typed confirmation",
);

assert.match(
  source,
  /Apply Reference Skill template\?/,
  "editor smoke must verify template overwrite confirmation appears",
);

assert.match(
  source,
  /Template Keep draft should preserve the custom body/,
  "editor smoke must verify Keep draft preserves unsaved content",
);

assert.match(
  source,
  /Template Apply should replace the custom body/,
  "editor smoke must verify Apply template replaces unsaved content after confirmation",
);

console.log("Smoke runner static tests passed");
