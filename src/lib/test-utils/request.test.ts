import assert from "node:assert/strict";
import {
  jsonRequest,
  localRequest,
  nonLocalRequest,
  TEST_LOCAL_HOST,
} from "./request";

async function main() {
  const local = localRequest("/api/settings");
  assert.equal(local.url, "http://127.0.0.1:3000/api/settings");
  assert.equal(local.headers.get("host"), TEST_LOCAL_HOST);

  const nonLocal = nonLocalRequest("/api/settings");
  assert.equal(nonLocal.headers.get("host"), "example.com");

  const json = jsonRequest("/api/skills", {
    name: "review",
    content: "Review code.",
  });
  assert.equal(json.method, "POST");
  assert.equal(json.headers.get("host"), TEST_LOCAL_HOST);
  assert.equal(json.headers.get("content-type"), "application/json");
  assert.deepEqual(await json.json(), {
    name: "review",
    content: "Review code.",
  });

  const override = localRequest("http://localhost:3000/api/index", {
    headers: { host: "localhost:3000", "x-test": "1" },
  });
  assert.equal(override.url, "http://localhost:3000/api/index");
  assert.equal(override.headers.get("host"), "localhost:3000");
  assert.equal(override.headers.get("x-test"), "1");

  console.log("Test request helper tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
