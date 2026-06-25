import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("scripts/smoke-local.mjs", "utf8");
const interactionSource = readFileSync(
  "scripts/smoke/interaction-assertions.mjs",
  "utf8",
);

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
  interactionSource,
  /control\.height\s*<\s*44/,
  "interactive accessibility smoke must enforce 44px minimum target height",
);

assert.match(
  interactionSource,
  /control\.width\s*<\s*44/,
  "interactive accessibility smoke must enforce 44px minimum target width",
);

assert.match(
  source,
  /assertRouteSemanticState/,
  "interactive accessibility smoke must reuse the semantic route validator",
);

assert.match(
  source,
  /assertRouteInteractionState/,
  "interactive accessibility smoke must reuse the shared interaction validator",
);

assert.match(
  source,
  /async function keyboardActivateButtonLocator/,
  "local smoke must include a helper for keyboard button activation",
);

assert.match(
  source,
  /async function keyboardActivateLinkLocator/,
  "local smoke must include a helper for keyboard link activation",
);

assert.match(
  source,
  /runKeyboardNavigationSmoke/,
  "local smoke must verify keyboard navigation across primary routes",
);

assert.match(
  source,
  /Path picker Shift\+Tab focus wrap/,
  "settings smoke must verify path picker keyboard focus wrapping",
);

assert.match(
  source,
  /Native folder picker cancel should leave the selected workspace path unchanged/,
  "settings smoke must verify native folder picker cancel keeps the current path",
);

assert.match(
  source,
  /Native folder picker is unavailable\. Use Browse app instead\./,
  "settings smoke must verify native folder picker error fallback copy",
);

assert.match(
  source,
  /Chat Shift\+Enter did not insert a newline/,
  "chat smoke must verify keyboard newline behavior before Enter submit",
);

assert.match(
  source,
  /Editor ArrowRight did not select the Mobile Preview tab/,
  "editor smoke must verify keyboard tablist navigation",
);

assert.match(
  source,
  /Guided End key step navigation/,
  "guided builder smoke must verify keyboard step navigation",
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
  /setManualQaItemStatus\(manualQaItem,\s*"Mark Passed",\s*"Passed"\)/,
  "settings smoke must verify manual QA evidence can be marked passed",
);

assert.match(
  source,
  /setManualQaItemStatus\(manualQaItem,\s*"Needs Fix",\s*"Needs fix"\)/,
  "settings smoke must verify manual QA evidence can be marked failed",
);

assert.match(
  source,
  /setManualQaItemStatus\(manualQaItem,\s*"Reset",\s*"Pending"\)/,
  "settings smoke must verify manual QA evidence can be reset",
);

assert.match(
  source,
  /markButtonLocatorCovered\(page\.locator\("\.settings-claude-refresh"\)\.first\(\)\)/,
  "settings smoke must explicitly account for the Claude panel refresh button after reloads",
);

assert.match(
  source,
  /async function downloadByButton[\s\S]*page\.waitForEvent\("download", \{ timeout: 60000 \}\)[\s\S]*Download did not start for button/,
  "export smoke must use bounded retryable download waits",
);

assert.equal(
  source.includes('downloadByButton(page, "Download Selected \\\\+ Diagnostics", {\n    exact: false,'),
  true,
  "export smoke must use the bounded download helper for selected diagnostics downloads",
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
  /Smoke Claude CLI test failed\./,
  "settings smoke must verify Claude CLI smoke-test failure handling",
);

assert.match(
  source,
  /Test: Failed - Smoke Claude CLI test failed\./,
  "settings smoke must verify Claude CLI failure appears in the panel alert",
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
  /\/api\/skills\/import\/apply[\s\S]*response\.ok\(\)/,
  "skills smoke must wait for successful import apply responses before checking imported rows",
);

assert.match(
  source,
  /importedSkillButton\.waitFor\(\{\s*state:\s*"visible",\s*timeout:\s*60000\s*\}\)/,
  "skills smoke must wait for imported folder skill rows after import",
);

assert.match(
  source,
  /zipImportedSkillButton\.waitFor\(\{\s*state:\s*"visible",\s*timeout:\s*60000\s*\}\)/,
  "skills smoke must wait for imported zip skill rows after import",
);

assert.match(
  source,
  /clickButton\(page,\s*"Restore smoke-imported-skill"\)/,
  "skills smoke must exercise the restore action",
);

assert.doesNotMatch(
  source,
  /markVisibleButtonsCoveredByLabel\(\s*page,\s*\[[^\]]*"Restore smoke-imported-skill"/,
  "skills smoke must not expect the restore button to remain visible after restore succeeds",
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

assert.match(
  source,
  /async function gotoAndExpectText[\s\S]*waitUntil:\s*"domcontentloaded"/,
  "route smoke helper must wait for rendered text instead of network idle",
);

assert.doesNotMatch(
  source,
  /page\.goto\(`\$\{baseUrl\}\/export`,\s*\{\s*waitUntil:\s*"networkidle"\s*\}\)/,
  "export route smoke must not rely on network idle before checking page text",
);

console.log("Smoke runner static tests passed");
