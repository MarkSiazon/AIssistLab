import assert from "node:assert/strict";
import { APP_ROUTES, appSkillEditorRoute } from "@/lib/routes/app-routes";
import { collectAppRouterRouteFiles } from "@/lib/test-utils/static-source";
import { isSafeInternalActionHref } from "@/lib/ui/internal-action-href";

assert.equal(APP_ROUTES.chat, "/chat");
assert.equal(APP_ROUTES.editor, "/editor");
assert.equal(APP_ROUTES.editorGuidedDraft, "/editor?guidedDraft=1");
assert.equal(APP_ROUTES.guidedBuilder, "/editor/guided");
assert.equal(APP_ROUTES.export, "/export");
assert.equal(APP_ROUTES.exportDiagnostics, "/export?diagnostics=true");
assert.equal(APP_ROUTES.settings, "/settings");
assert.equal(APP_ROUTES.skills, "/skills");

for (const href of Object.values(APP_ROUTES)) {
  assert.equal(isSafeInternalActionHref(href), true, `${href} should be safe`);
}

assert.equal(
  appSkillEditorRoute("space skill"),
  "/editor/space%20skill",
);
assert.equal(
  appSkillEditorRoute("../escape"),
  "/editor/..%2Fescape",
);
const pageRoutes = collectAppRouterRouteFiles(
  "src/app",
  ".tsx",
  "page.tsx",
).map((file) => file.route);

const staticPageRoutes = pageRoutes
  .filter((route) => route !== "/" && !route.includes(":"))
  .sort();

const staticAppRouteBases = Array.from(
  new Set(Object.values(APP_ROUTES).map((route) => route.split("?")[0])),
).sort();

assert.deepEqual(
  staticAppRouteBases,
  staticPageRoutes,
  "APP_ROUTES should list every static navigable src/app page route",
);

assert.deepEqual(
  pageRoutes.filter((route) => route.includes(":")).sort(),
  ["/editor/:skillName"],
  "Dynamic app page routes should stay covered by encoded route builders",
);

console.log("App route constants tests passed");
