import assert from "node:assert/strict";
import { displaySettingsPath } from "./settings-path-display";

function main() {
  assert.equal(
    displaySettingsPath("C:\\Users\\Someone\\.config\\profiles\\work"),
    "~\\.config\\profiles\\work",
    "local Windows home paths should be collapsed before display",
  );

  assert.equal(
    displaySettingsPath("Configured for person@example.com"),
    "Configured for [redacted-email]",
    "email-like account identifiers should be redacted",
  );

  assert.equal(
    displaySettingsPath(undefined),
    "Settings file not loaded",
    "missing settings path should render a stable empty-state label",
  );

  assert.equal(
    displaySettingsPath("C:\\Users\\Someone\\project\\.env.local"),
    "~\\project\\.env.local",
    "short sanitized paths should be shown without extra truncation",
  );

  assert.equal(
    displaySettingsPath(
      "C:\\Users\\Someone\\very\\long\\workspace\\folder\\with\\many\\segments\\.claude\\skills",
    ),
    ".../.claude/skills",
    "long paths with segments should be compacted to their final two segments",
  );

  assert.equal(
    displaySettingsPath("a".repeat(70)),
    `${"a".repeat(26)}...${"a".repeat(26)}`,
    "long unsegmented values should be center-truncated",
  );

  console.log("Settings path display helper tests passed");
}

main();
