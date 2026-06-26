import assert from "node:assert/strict";
import {
  API_ROUTES,
  apiSettingsBrowseRoute,
  apiSettingsNativeFolderRoute,
  apiSettingsPathExistsRoute,
  apiSkillRestoreRoute,
  apiSkillRoute,
} from "@/lib/routes/api-routes";
import { collectAppRouterRouteFiles } from "@/lib/test-utils/static-source";
import { isSafeInternalActionHref } from "@/lib/ui/internal-action-href";

assert.equal(API_ROUTES.chat, "/api/chat");
assert.equal(API_ROUTES.chatStatus, "/api/chat/status");
assert.equal(API_ROUTES.index, "/api/index");
assert.equal(API_ROUTES.settings, "/api/settings");
assert.equal(API_ROUTES.settingsBrowseSearch, "/api/settings/browse/search");
assert.equal(
  API_ROUTES.settingsClaudeCliProfiles,
  "/api/settings/claude-cli/profiles",
);
assert.equal(API_ROUTES.settingsClaudeProject, "/api/settings/claude-project");
assert.equal(API_ROUTES.skills, "/api/skills");
assert.equal(API_ROUTES.skillsTemplates, "/api/skills/templates");
assert.equal(API_ROUTES.releaseReadiness, "/api/release/readiness");

for (const href of Object.values(API_ROUTES)) {
  assert.equal(isSafeInternalActionHref(href), true, `${href} should be safe`);
}

assert.equal(
  apiSkillRoute("space skill"),
  "/api/skills/space%20skill",
);
assert.equal(
  apiSkillRoute("../escape"),
  "/api/skills/..%2Fescape",
);
assert.equal(
  apiSkillRestoreRoute("space skill"),
  "/api/skills/space%20skill/restore",
);
assert.equal(
  apiSettingsBrowseRoute("C:\\workspace folder"),
  "/api/settings/browse?path=C%3A%5Cworkspace%20folder",
);
assert.equal(
  apiSettingsPathExistsRoute("C:\\workspace folder"),
  "/api/settings/path-exists?path=C%3A%5Cworkspace%20folder",
);

const params = new URLSearchParams({ field: "WORKSPACE_ROOT" });
assert.equal(
  apiSettingsNativeFolderRoute(params),
  "/api/settings/native-folder?field=WORKSPACE_ROOT",
);

const handlerRoutes = collectAppRouterRouteFiles(
  "src/app/api",
  ".ts",
  "route.ts",
).map((file) => file.route);

const staticHandlerRoutes = handlerRoutes
  .filter((route) => !route.includes(":"))
  .sort();

assert.deepEqual(
  Object.values(API_ROUTES).slice().sort(),
  staticHandlerRoutes,
  "API_ROUTES should list every static src/app/api route handler",
);

assert.deepEqual(
  handlerRoutes.filter((route) => route.includes(":")).sort(),
  ["/api/skills/:skillName", "/api/skills/:skillName/restore"],
  "Dynamic API route handlers should stay covered by encoded route builders",
);

console.log("API route constants tests passed");
