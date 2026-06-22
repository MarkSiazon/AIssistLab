import assert from "node:assert/strict";
import { assignSafeInternalLocation } from "./safe-navigation";

const location = { href: "/initial" };

assert.equal(assignSafeInternalLocation(location, "/settings"), true);
assert.equal(location.href, "/settings");

assert.equal(assignSafeInternalLocation(location, "/export?diagnostics=true"), true);
assert.equal(location.href, "/export?diagnostics=true");

assert.equal(assignSafeInternalLocation(location, "https://example.com"), false);
assert.equal(location.href, "/export?diagnostics=true");

assert.equal(assignSafeInternalLocation(location, "javascript:alert(1)"), false);
assert.equal(location.href, "/export?diagnostics=true");

assert.equal(assignSafeInternalLocation(location, "/%2fexample.com"), false);
assert.equal(location.href, "/export?diagnostics=true");

console.log("Safe navigation tests passed");
