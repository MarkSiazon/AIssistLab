import assert from "node:assert/strict";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import { isSafeInternalActionHref } from "@/lib/ui/internal-action-href";

assert.equal(APP_ROUTES.chat, "/chat");
assert.equal(APP_ROUTES.editor, "/editor");
assert.equal(APP_ROUTES.guidedBuilder, "/editor/guided");
assert.equal(APP_ROUTES.export, "/export");
assert.equal(APP_ROUTES.exportDiagnostics, "/export?diagnostics=true");
assert.equal(APP_ROUTES.settings, "/settings");
assert.equal(APP_ROUTES.skills, "/skills");

for (const href of Object.values(APP_ROUTES)) {
  assert.equal(isSafeInternalActionHref(href), true, `${href} should be safe`);
}

console.log("App route constants tests passed");
