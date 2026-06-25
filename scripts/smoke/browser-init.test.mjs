import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installMockClipboard, readMockClipboardText } from "./browser-init.mjs";

const initScripts = [];
const page = {
  async addInitScript(script) {
    initScripts.push(script);
  },
  async evaluate(script) {
    return script();
  },
};

await installMockClipboard(page);

assert.equal(initScripts.length, 1, "mock clipboard should install one init script");
assert.match(
  String(initScripts[0]),
  /__smokeCopiedText/,
  "mock clipboard init script should record copied text for assertions",
);

globalThis.window = { __smokeCopiedText: "Copied smoke text" };
assert.equal(
  await readMockClipboardText(page),
  "Copied smoke text",
  "mock clipboard reader should return the copied smoke text",
);
delete globalThis.window;

for (const runnerPath of ["scripts/smoke-local.mjs", "scripts/smoke-production.mjs"]) {
  const source = readFileSync(runnerPath, "utf8");
  assert.match(
    source,
    /installMockClipboard/,
    `${runnerPath} should use the shared mock clipboard installer`,
  );
  assert.match(
    source,
    /readMockClipboardText/,
    `${runnerPath} should use the shared mock clipboard reader`,
  );
}

console.log("Browser init smoke helpers passed");
