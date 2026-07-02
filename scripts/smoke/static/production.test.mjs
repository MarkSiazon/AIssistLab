import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const verifyReleaseSource = readFileSync("scripts/release/verify.mjs", "utf8");
const productionSmokeSource = readFileSync("scripts/smoke/runners/production.mjs", "utf8");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

assert.equal(
  packageJson.scripts["smoke:production"],
  "node scripts/smoke/runners/production.mjs",
  "package.json must expose the production smoke command",
);

assert.match(
  verifyReleaseSource,
  /runCommand\("Production server smoke",\s*"npm",\s*\["run",\s*"smoke:production"\]\)/,
  "verify:release must run the production server smoke after the build",
);

assert.match(
  productionSmokeSource,
  /startNextServer\(\{\s*root,\s*mode: "start",\s*port,/,
  "production smoke must start the built Next app through the shared localhost server helper",
);

assert.match(
  productionSmokeSource,
  /assertRouteVisualState/,
  "production smoke must assert visual route state for rendered pages",
);

assert.match(
  productionSmokeSource,
  /assertRouteSemanticState/,
  "production smoke must assert semantic route state for rendered pages",
);

assert.match(
  productionSmokeSource,
  /assertRouteInteractionState/,
  "production smoke must assert interaction route state for rendered pages",
);

assert.match(
  productionSmokeSource,
  /assertVisibleButtonsAccountedFor/,
  "production smoke must assert visible button coverage for driven built-app states",
);

assert.match(
  productionSmokeSource,
  /assertVisibleLinksAccountedFor/,
  "production smoke must assert visible link coverage for driven built-app states",
);

assert.match(
  productionSmokeSource,
  /assertCurrentRouteDomCoverage/,
  "production smoke must use the shared DOM coverage helper for driven states",
);

assert.match(
  productionSmokeSource,
  /\["mobile",\s*\{\s*width:\s*390,\s*height:\s*844,\s*isMobile:\s*true\s*\}\]/,
  "production smoke must include a mobile viewport visual pass",
);

assert.match(
  productionSmokeSource,
  /\["desktop",\s*\{\s*width:\s*1366,\s*height:\s*920\s*\}\]/,
  "production smoke must include a desktop viewport visual pass",
);

for (const route of [
  "/settings",
  "/skills",
  "/chat",
  "/export",
  "/editor",
  "/editor/guided",
]) {
  assert.match(
    productionSmokeSource,
    new RegExp(`\\["${route.replace("/", "\\/")}",\\s*"`),
    `production smoke must verify ${route}`,
  );
}

for (const endpoint of [
  "/api/chat",
  "/api/chat/status",
  "/api/index",
  "/api/release/readiness",
  "/api/settings",
  "/api/settings/doctor",
  "/api/settings/runtime",
  "/api/settings/claude-project",
  "/api/settings/path-exists?path=.",
  "/api/settings/browse?path=.",
  "/api/settings/browse/search?q=demo",
  "/api/settings/native-folder",
  "/api/skills",
  "/api/skills/templates",
  "/api/skills/validation",
  "/api/skills/browser-smoke-skill",
  "/api/skills/browser-smoke-skill/restore",
  "/api/skills/guided/draft",
  "/api/skills/guided/feedback",
  "/api/skills/import/preview",
  "/api/skills/import/apply",
  "/api/export",
  "/api/export/zip?diagnostics=true",
  "/api/settings/claude-cli",
  "/api/settings/claude-cli/profiles",
  "/api/settings/claude-cli/test",
]) {
  assert.match(
    productionSmokeSource,
    new RegExp(escapeRegExp(endpoint)),
    `production smoke must verify ${endpoint}`,
  );
}

assert.match(
  productionSmokeSource,
  /\[\s*"\/api\/chat",\s*\{\s*method:\s*"POST"/,
  "production smoke must verify POST /api/chat is production-guarded",
);

for (const guardedMutation of [
  '["/api/skills", { method: "POST"',
  '["/api/skills/browser-smoke-skill", { method: "PUT"',
  '["/api/skills/browser-smoke-skill", { method: "DELETE"',
  '["/api/skills/browser-smoke-skill/restore", { method: "POST"',
  '["/api/skills/guided/draft", { method: "POST"',
  '["/api/skills/guided/feedback", { method: "POST"',
]) {
  assert.equal(
    productionSmokeSource.includes(guardedMutation),
    true,
    `production smoke must verify ${guardedMutation} is production-guarded`,
  );
}

assert.match(
  productionSmokeSource,
  /Local device access is disabled in production mode\./,
  "production smoke must verify device-local APIs return the production guard message",
);

assert.match(
  productionSmokeSource,
  /Local Claude CLI is disabled in production mode\./,
  "production smoke must verify Claude CLI APIs return the production guard message",
);

assert.match(
  productionSmokeSource,
  /assertNoUnsafe\(/,
  "production smoke must run privacy assertions on API responses",
);

assert.match(
  productionSmokeSource,
  /Production browser issues/,
  "production smoke must fail on browser console, page, or 500-response issues",
);

assert.match(
  productionSmokeSource,
  /runProductionInteractionSmoke/,
  "production smoke must verify built-app interaction states",
);

for (const interaction of [
  "production editor template confirmation",
  "production guided clear confirmation",
  "production chat expanded citation",
  "production chat collapsed citation",
  "Send boundary",
  "Provider calls happen only when you send a message.",
]) {
  assert.match(
    productionSmokeSource,
    new RegExp(escapeRegExp(interaction)),
    `production smoke must verify ${interaction}`,
  );
}

assert.match(
  productionSmokeSource,
  /Production mock assistant response\./,
  "production smoke must verify mocked chat send/copy behavior in the built app",
);

assert.match(
  productionSmokeSource,
  /runProductionExportInteractionSmoke/,
  "production smoke must verify built-app export interaction states",
);

for (const exportInteraction of [
  "production export selected skill",
  "Diagnostics bundle excludes",
  "API keys and bearer tokens",
  "Download 1 selected skills with diagnostics",
  "Download release-readiness-smoke as Markdown",
  "skill=release-readiness-smoke",
  "diagnostics=true",
]) {
  assert.match(
    productionSmokeSource,
    new RegExp(escapeRegExp(exportInteraction)),
    `production smoke must verify ${exportInteraction}`,
  );
}

assert.match(
  productionSmokeSource,
  /runProductionSettingsInteractionSmoke/,
  "production smoke must verify built-app Settings interaction states",
);

for (const settingsInteraction of [
  "production settings ready state",
  "production settings refreshed state",
  "production settings saved state",
  "Data Boundary",
  "Provider context is sent only when you send a chat message.",
  "Diagnostics omit API keys",
  "Manual QA Evidence",
  "Choose a local folder path",
  "Production path picker did not apply the selected folder to Settings",
  "Needs fix",
  "Skipped",
  "Rebuild Index",
  "Saved and applied to this server session.",
]) {
  assert.match(
    productionSmokeSource,
    new RegExp(escapeRegExp(settingsInteraction)),
    `production smoke must verify ${settingsInteraction}`,
  );
}

console.log("Production smoke runner static tests passed");
