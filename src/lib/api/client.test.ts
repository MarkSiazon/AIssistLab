import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  apiErrorMessage,
  jsonRequestInit,
  optionalJson,
  postJson,
  readResponseJson,
  requestJsonWithFetcher,
} from "./client";

describe("api client helpers", () => {
  it("extracts string API errors and falls back for unknown payloads", () => {
    assert.equal(apiErrorMessage({ error: "Bad path" }, "Fallback"), "Bad path");
    assert.equal(apiErrorMessage({ error: 42 }, "Fallback"), "Fallback");
    assert.equal(apiErrorMessage(null, "Fallback"), "Fallback");
  });

  it("returns an empty object for non-JSON responses", async () => {
    const payload = await readResponseJson(new Response("not json"));

    assert.deepEqual(payload, {});
  });

  it("throws sanitized errors from failed JSON responses", async () => {
    await assert.rejects(
      () =>
        requestJsonWithFetcher(
          async () => Response.json({ error: "Denied" }, { status: 403 }),
          "/api/example",
          undefined,
          "Fallback",
        ),
      /Denied/,
    );
  });

  it("returns null for optional failed JSON requests", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      Response.json({ error: "Nope" }, { status: 500 })) as typeof fetch;

    try {
      assert.equal(await optionalJson("/api/example"), null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("builds JSON POST request init", () => {
    const init = postJson({ ok: true });

    assert.equal(init.method, "POST");
    assert.deepEqual(init.headers, { "Content-Type": "application/json" });
    assert.equal(init.body, "{\"ok\":true}");
  });

  it("builds JSON request init for arbitrary methods", () => {
    const init = jsonRequestInit("DELETE", { confirmName: "demo" });

    assert.equal(init.method, "DELETE");
    assert.deepEqual(init.headers, { "Content-Type": "application/json" });
    assert.equal(init.body, "{\"confirmName\":\"demo\"}");
  });
});

console.log("API client helper tests passed");
