import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { jsonError, textDownloadResponse } from "./responses";

describe("api responses", () => {
  it("returns a JSON error response with the requested status", async () => {
    const response = jsonError("Bad request", 400);

    assert.equal(response.status, 400);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.deepEqual(await response.json(), { error: "Bad request" });
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
