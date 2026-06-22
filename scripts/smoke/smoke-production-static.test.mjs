import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const verifyReleaseSource = readFileSync("scripts/verify-release.mjs", "utf8");
const productionSmokeSource = readFileSync("scripts/smoke-production.mjs", "utf8");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

assert.equal(
  packageJson.scripts["smoke:production"],
  "node scripts/smoke-production.mjs",
  "package.json must expose the production smoke command",
);

assert.match(
  verifyReleaseSource,
  /runCommand\("Production server smoke",\s*"npm",\s*\["run",\s*"smoke:production"\]\)/,
  "verify:release must run the production server smoke after the build",
);

assert.match(
  productionSmokeSource,
  /\[nextBin,\s*"start",\s*"-H",\s*"127\.0\.0\.1"/,
  "production smoke must start the built Next app with next start on localhost",
);

assert.match(
  productionSmokeSource,
  /assertRouteVisualState/,
  "production smoke must assert visual route state for rendered pages",
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
  /expectProductionChatMissingKeyStream/,
  "production smoke must verify production /api/chat missing-key stream behavior",
);

assert.match(
  productionSmokeSource,
  /ANTHROPIC_API_KEY is not configured/,
  "production smoke must verify the missing API key chat error is actionable",
);

assert.match(
  productionSmokeSource,
  /\/api\/chat missing-key stream/,
  "production smoke must run privacy assertions on the missing-key chat stream",
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

console.log("Production smoke runner static tests passed");
