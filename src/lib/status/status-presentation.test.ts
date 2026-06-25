import assert from "node:assert/strict";
import {
  blockingReadinessColor,
  blockingReadinessLabel,
  blockingReadinessTone,
  optionalReadinessColor,
  statusSeverityColor,
} from "@/lib/status/status-presentation";

assert.equal(statusSeverityColor("ok"), "var(--green)");
assert.equal(statusSeverityColor("warn"), "var(--yellow)");
assert.equal(statusSeverityColor("error"), "var(--red)");

assert.equal(optionalReadinessColor("ready"), "var(--green)");
assert.equal(optionalReadinessColor("needs_action"), "var(--yellow)");
assert.equal(optionalReadinessColor("optional"), "var(--text-muted)");

assert.equal(blockingReadinessColor("ready"), "var(--green)");
assert.equal(blockingReadinessColor("needs_action"), "var(--yellow)");
assert.equal(blockingReadinessColor("blocked"), "var(--red)");

assert.equal(blockingReadinessLabel("ready"), "Ready");
assert.equal(blockingReadinessLabel("needs_action"), "Needs action");
assert.equal(blockingReadinessLabel("blocked"), "Blocked");

assert.equal(blockingReadinessTone("ready"), "ok");
assert.equal(blockingReadinessTone("needs_action"), "warn");
assert.equal(blockingReadinessTone("blocked"), "error");

console.log("Status presentation helper tests passed");
