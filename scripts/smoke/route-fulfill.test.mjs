import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  fulfillAttachment,
  fulfillEventStream,
  fulfillJson,
} from "./route-fulfill.mjs";

const calls = [];
const route = {
  async fulfill(options) {
    calls.push(options);
  },
};

await fulfillJson(route, { ok: true, count: 2 });
await fulfillJson(route, { error: "Failed." }, { status: 500 });
await fulfillEventStream(route, "data: smoke\n\n");
await fulfillAttachment(route, {
  contentType: "text/markdown",
  filename: "smoke.md",
  body: "# Smoke\n",
});

assert.deepEqual(calls, [
  {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, count: 2 }),
  },
  {
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ error: "Failed." }),
  },
  {
    contentType: "text/event-stream",
    body: "data: smoke\n\n",
  },
  {
    contentType: "text/markdown",
    headers: {
      "content-disposition": 'attachment; filename="smoke.md"',
    },
    body: "# Smoke\n",
  },
]);

for (const runnerPath of ["scripts/smoke-local.mjs", "scripts/smoke-production.mjs"]) {
  assert.doesNotMatch(
    readFileSync(runnerPath, "utf8"),
    /route\.fulfill\(/,
    `${runnerPath} should use route fulfillment helpers instead of direct route.fulfill calls`,
  );
}

console.log("Route fulfillment helper tests passed");
