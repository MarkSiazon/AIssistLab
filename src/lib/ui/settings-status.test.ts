import assert from "node:assert/strict";
import {
  doctorSeverityLabel,
  doctorStatusColor,
  firstRunStatusClass,
  firstRunStatusColor,
  pathStateLabel,
  pathStateTone,
  pathStateBadgePresentation,
  profileOptionLabel,
  profileStatusColor,
  profileStatusText,
  releaseStatusColor,
  releaseStatusLabel,
  releaseStatusTone,
} from "./settings-status";

async function main() {
  assert.equal(doctorStatusColor("ok"), "var(--green)");
  assert.equal(doctorStatusColor("warn"), "var(--yellow)");
  assert.equal(doctorStatusColor("error"), "var(--red)");
  assert.equal(doctorSeverityLabel("blocking"), "Blocking");
  assert.equal(doctorSeverityLabel("warning"), "Warning");
  assert.equal(doctorSeverityLabel("optional"), "Optional");

  assert.equal(releaseStatusColor("ready"), "var(--green)");
  assert.equal(releaseStatusColor("blocked"), "var(--red)");
  assert.equal(releaseStatusColor("needs_action"), "var(--yellow)");
  assert.equal(releaseStatusLabel("ready"), "Ready");
  assert.equal(releaseStatusLabel("blocked"), "Blocked");
  assert.equal(releaseStatusLabel("needs_action"), "Needs action");
  assert.equal(releaseStatusTone("ready"), "ok");
  assert.equal(releaseStatusTone("blocked"), "error");
  assert.equal(releaseStatusTone("needs_action"), "warn");

  assert.equal(firstRunStatusColor("ready"), "var(--green)");
  assert.equal(firstRunStatusColor("optional"), "var(--text-muted)");
  assert.equal(firstRunStatusColor("needs_action"), "var(--yellow)");
  assert.equal(firstRunStatusClass("ready"), "settings-first-run-item-ready");
  assert.equal(firstRunStatusClass("optional"), "settings-first-run-item-optional");
  assert.equal(
    firstRunStatusClass("needs_action"),
    "settings-first-run-item-needs-action",
  );

  assert.equal(pathStateLabel("ok"), "Valid");
  assert.equal(pathStateLabel("error"), "Needs fix");
  assert.equal(pathStateLabel("checking"), "Checking");
  assert.equal(pathStateLabel("idle"), "Not checked");
  assert.equal(pathStateTone("ok"), "ok");
  assert.equal(pathStateTone("error"), "error");
  assert.equal(pathStateTone("checking"), "warn");
  assert.equal(pathStateTone("idle"), "neutral");
  assert.deepEqual(pathStateBadgePresentation("checking"), {
    text: "checking...",
    color: "var(--text-muted)",
  });
  assert.deepEqual(pathStateBadgePresentation("ok"), {
    text: "found",
    color: "var(--green)",
  });
  assert.deepEqual(pathStateBadgePresentation("error"), {
    text: "not found",
    color: "var(--red)",
  });
  assert.equal(pathStateBadgePresentation("idle"), null);

  const signedInProfile = {
    label: "Profile 1",
    auth: { checked: true, loggedIn: true },
  };
  const signedOutProfile = {
    label: "Profile 2",
    auth: { checked: true, loggedIn: false },
  };
  assert.equal(profileStatusText(undefined), "Not checked");
  assert.equal(profileStatusText(signedInProfile), "Signed in");
  assert.equal(profileStatusText(signedOutProfile), "Not signed in");
  assert.equal(profileStatusColor(undefined), "var(--text-muted)");
  assert.equal(profileStatusColor(signedInProfile), "var(--green)");
  assert.equal(profileStatusColor(signedOutProfile), "var(--yellow)");
  assert.equal(profileOptionLabel(signedInProfile), "Profile 1 - Signed in");

  console.log("Settings status helper tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
