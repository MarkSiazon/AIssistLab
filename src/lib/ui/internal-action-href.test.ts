import assert from "node:assert/strict";
import { isSafeInternalActionHref } from "./internal-action-href";

assert.equal(isSafeInternalActionHref("/settings"), true);
assert.equal(isSafeInternalActionHref("/export?diagnostics=true"), true);
assert.equal(isSafeInternalActionHref("/api/export?skill=%2F%2Fexample.com"), true);
assert.equal(isSafeInternalActionHref("/settings#setup-doctor"), true);
assert.equal(isSafeInternalActionHref(""), false);
assert.equal(isSafeInternalActionHref(" /settings"), false);
assert.equal(isSafeInternalActionHref("/settings "), false);
assert.equal(isSafeInternalActionHref("//example.com"), false);
assert.equal(isSafeInternalActionHref("/%2fexample.com"), false);
assert.equal(isSafeInternalActionHref("/%5cexample.com"), false);
assert.equal(isSafeInternalActionHref("/editor/%2fsecret"), false);
assert.equal(isSafeInternalActionHref("/settings/%5csecret"), false);
assert.equal(isSafeInternalActionHref("/settings%0Aevil"), false);
assert.equal(isSafeInternalActionHref("/settings%0Devil"), false);
assert.equal(isSafeInternalActionHref("/settings?next=%0Aevil"), false);
assert.equal(isSafeInternalActionHref("/\\example.com"), false);
assert.equal(isSafeInternalActionHref("/settings bad"), false);
assert.equal(isSafeInternalActionHref("https://example.com"), false);
assert.equal(isSafeInternalActionHref("javascript:alert(1)"), false);

console.log("Internal action href tests passed");
