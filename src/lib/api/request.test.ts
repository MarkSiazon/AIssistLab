import assert from "node:assert/strict";
import { readJsonObject } from "./request";

async function main() {
  const valid = await readJsonObject(
    new Request("http://127.0.0.1/api/test", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
    }),
  );
  assert.deepEqual(valid, { ok: true });

  const invalid = await readJsonObject(
    new Request("http://127.0.0.1/api/test", {
      method: "POST",
      body: "{",
    }),
  );
  assert.equal(invalid, null);

  const nonObject = await readJsonObject(
    new Request("http://127.0.0.1/api/test", {
      method: "POST",
      body: "[]",
    }),
  );
  assert.equal(nonObject, null);

  console.log("API request helper tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
