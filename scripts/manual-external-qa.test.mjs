import assert from "node:assert/strict";
import {
  assertManualQaSnapshotSafe,
  formatManualQaReport,
  normalizeBaseUrl,
  runManualQaHelper,
} from "./manual-external-qa.mjs";

assert.equal(normalizeBaseUrl("http://localhost:3000/"), "http://localhost:3000");
assert.throws(() => normalizeBaseUrl("file:///tmp/app"), /Invalid manual QA base URL/);

const safeEntries = [
  {
    ok: true,
    status: 200,
    path: "/api/release/readiness",
    payload: {
      summary: {
        status: "needs_action",
        score: 82,
      },
    },
  },
  {
    ok: true,
    status: 200,
    path: "/api/chat/status",
    payload: {
      canSend: false,
      blockingReason: "Provider auth needs attention.",
    },
  },
  {
    ok: true,
    status: 200,
    path: "/api/settings/runtime",
    payload: {
      provider: "anthropic_api",
      source: "runtime",
    },
  },
  {
    ok: true,
    status: 200,
    path: "/api/settings/claude-cli/profiles",
    payload: {
      profiles: [
        {
          id: "default",
          label: "Default profile",
          selected: true,
        },
      ],
    },
  },
];

assert.doesNotThrow(() => assertManualQaSnapshotSafe(safeEntries));

const report = formatManualQaReport("http://localhost:3000", safeEntries);
assert.match(report, /Native folder picker/);
assert.match(report, /Claude Open Login/);
assert.match(report, /Account-backed chat/);
assert.match(report, /Release readiness: needs_action \(82\/100\)/);
assert.match(report, /Chat readiness: blocked \(Provider auth needs attention\.\)/);
assert.match(report, /Settings Manual QA Evidence panel/);
assert.match(report, /does not write evidence files/);
assert.doesNotMatch(report, /C:\\Users|sk-ant-|oauth\.json|Bearer /i);

await assert.rejects(
  () =>
    runManualQaHelper({
      baseUrl: "http://localhost:3000",
      fetchImpl: async (url) => ({
        ok: true,
        status: 200,
        async text() {
          if (String(url).includes("runtime")) {
            return JSON.stringify({
              provider: "anthropic_api",
              source: "runtime",
              leaked: String.raw`C:\Users\Example\.claude\oauth.json`,
            });
          }
          return "{}";
        },
      }),
    }),
  /leaked .*path/,
);

console.log("Manual external QA helper tests passed");
