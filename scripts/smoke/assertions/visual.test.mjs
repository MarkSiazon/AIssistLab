import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import {
  analyzePngVisualContent,
  assertPngHasVisualContent,
} from "./visual.mjs";

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  return Buffer.concat([length, Buffer.from(type, "ascii"), data, Buffer.alloc(4)]);
}

function pngFromPixels(width, height, pixelFor) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4;
      const [red, green, blue, alpha = 255] = pixelFor(x, y);
      row[offset] = red;
      row[offset + 1] = green;
      row[offset + 2] = blue;
      row[offset + 3] = alpha;
    }
    rows.push(row);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const blank = pngFromPixels(320, 480, () => [255, 255, 255, 255]);
const blankStats = analyzePngVisualContent(blank);
assert.equal(blankStats.width, 320);
assert.equal(blankStats.height, 480);
assert.equal(blankStats.colorBucketCount, 1);
assert.equal(blankStats.nonBackgroundRatio, 0);
assert.throws(
  () => assertPngHasVisualContent(blank, "blank route"),
  /visually blank|non-background/,
);

const colorfulContent = pngFromPixels(320, 480, (x, y) => {
  if (x >= 24 && x < 120 && y >= 32 && y < 72) return [20, 26, 36, 255];
  if (x >= 24 && x < 296 && y >= 112 && y < 156) {
    const shade = Math.floor((x - 24) / 17);
    return [40 + shade * 10, 80 + shade * 6, 120 + shade * 4, 255];
  }
  if (x >= 24 && x < 280 && y >= 200 && y < 260) return [229, 231, 235, 255];
  return [255, 255, 255, 255];
});
const contentStats = assertPngHasVisualContent(colorfulContent, "content route");
assert.ok(contentStats.colorBucketCount >= 8);
assert.ok(contentStats.nonBackgroundRatio >= 0.005);
assert.ok(contentStats.darkPixelRatio >= 0.0005);

assert.throws(
  () => analyzePngVisualContent(Buffer.from("not png")),
  /PNG buffer/,
);

console.log("Visual assertion helper tests passed");
