import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  jsonError,
  jsonFailure,
  jsonValidationFailure,
  textDownloadResponse,
} from "./responses";

describe("api responses", () => {
  it("returns a JSON error response with the requested status", async () => {
    const response = jsonError("Bad request", 400);

    assert.equal(response.status, 400);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.deepEqual(await response.json(), { error: "Bad request" });
  });

  it("returns a JSON failure response with the ok/error contract", async () => {
    const response = jsonFailure("Restore failed", 400);

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "Restore failed",
    });
  });

  it("returns a JSON validation failure response", async () => {
    const validationErrors = [{ code: "empty_body" }];
    const response = jsonValidationFailure(validationErrors);

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      validationErrors,
    });
  });

  it("includes optional validation failure fields", async () => {
    const response = jsonValidationFailure(
      [{ code: "missing_purpose" }],
      422,
      { feedback: { score: 20 } },
    );

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
      ok: false,
      validationErrors: [{ code: "missing_purpose" }],
      feedback: { score: 20 },
    });
  });

  it("returns a text download response with a safe attachment header", async () => {
    const response = textDownloadResponse("hello", "skill.md", "text/markdown");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/markdown");
    assert.equal(
      response.headers.get("content-disposition"),
      'attachment; filename="skill.md"',
    );
    assert.equal(await response.text(), "hello");
  });

  it("sanitizes unsafe download filename characters", () => {
    const response = textDownloadResponse(
      "hello",
      'bad"/\\:*?<>|;\r\n\tname.md',
    );

    assert.equal(
      response.headers.get("content-disposition"),
      'attachment; filename="bad_____________name.md"',
    );
  });
});
