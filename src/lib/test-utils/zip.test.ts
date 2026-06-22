import assert from "node:assert/strict";
import {
  createZip,
  extractZipEntries,
  spoofLocalUncompressedSize,
} from "./zip";

const zip = createZip({
  "alpha.md": "Alpha",
  "nested/beta.md": "Beta",
});

assert.deepEqual(extractZipEntries(zip), {
  "alpha.md": "Alpha",
  "nested/beta.md": "Beta",
});

const spoofed = spoofLocalUncompressedSize(zip, 123);
assert.equal(spoofed.readUInt32LE(22), 123);
assert.equal(zip.readUInt32LE(22), "Alpha".length);

assert.throws(
  () => extractZipEntries(Buffer.from("not a zip")),
  /ZIP end record not found/,
);

console.log("ZIP test helper tests passed");
