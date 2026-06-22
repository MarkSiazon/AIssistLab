import { inflateSync } from "node:zlib";

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function paethPredictor(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  if (upDistance <= upperLeftDistance) return up;
  return upperLeft;
}

function unfilterScanline(filter, scanline, previous, bytesPerPixel) {
  const output = Buffer.alloc(scanline.length);
  for (let index = 0; index < scanline.length; index += 1) {
    const left = index >= bytesPerPixel ? output[index - bytesPerPixel] : 0;
    const up = previous ? previous[index] : 0;
    const upperLeft =
      previous && index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
    let value = scanline[index];

    if (filter === 1) {
      value += left;
    } else if (filter === 2) {
      value += up;
    } else if (filter === 3) {
      value += Math.floor((left + up) / 2);
    } else if (filter === 4) {
      value += paethPredictor(left, up, upperLeft);
    } else if (filter !== 0) {
      throw new Error(`Unsupported PNG filter type ${filter}`);
    }

    output[index] = value & 0xff;
  }
  return output;
}

function readPng(buffer) {
  assert(Buffer.isBuffer(buffer), "Screenshot must be a buffer.");
  assert(
    buffer.subarray(0, pngSignature.length).equals(pngSignature),
    "Screenshot must be a PNG buffer.",
  );

  let offset = pngSignature.length;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.subarray(offset, offset + 4).toString("ascii");
    offset += 4;
    const data = buffer.subarray(offset, offset + length);
    offset += length + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      assert(interlace === 0, "Interlaced PNG screenshots are not supported.");
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  assert(width > 0 && height > 0, "PNG screenshot is missing dimensions.");
  assert(bitDepth === 8, `Unsupported PNG bit depth ${bitDepth}.`);
  assert(
    colorType === 2 || colorType === 6,
    `Unsupported PNG color type ${colorType}.`,
  );

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowLength = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const rows = [];
  let inputOffset = 0;
  let previous = null;

  for (let row = 0; row < height; row += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const scanline = inflated.subarray(inputOffset, inputOffset + rowLength);
    inputOffset += rowLength;
    const unfiltered = unfilterScanline(filter, scanline, previous, bytesPerPixel);
    rows.push(unfiltered);
    previous = unfiltered;
  }

  return { width, height, bytesPerPixel, rows };
}

export function analyzePngVisualContent(buffer) {
  const png = readPng(buffer);
  const buckets = new Set();
  let nonBackgroundPixels = 0;
  let darkPixels = 0;
  let transparentPixels = 0;
  let totalPixels = 0;

  for (const row of png.rows) {
    for (let index = 0; index < row.length; index += png.bytesPerPixel) {
      const red = row[index];
      const green = row[index + 1];
      const blue = row[index + 2];
      const alpha = png.bytesPerPixel === 4 ? row[index + 3] : 255;
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const colorDistanceFromWhite =
        Math.abs(255 - red) + Math.abs(255 - green) + Math.abs(255 - blue);

      totalPixels += 1;
      buckets.add(`${red >> 4}:${green >> 4}:${blue >> 4}:${alpha >> 6}`);
      if (alpha < 250) transparentPixels += 1;
      if (colorDistanceFromWhite > 18 || alpha < 250) nonBackgroundPixels += 1;
      if (luminance < 210 && alpha >= 250) darkPixels += 1;
    }
  }

  return {
    width: png.width,
    height: png.height,
    colorBucketCount: buckets.size,
    nonBackgroundRatio: nonBackgroundPixels / totalPixels,
    darkPixelRatio: darkPixels / totalPixels,
    transparentRatio: transparentPixels / totalPixels,
  };
}

export function assertPngHasVisualContent(buffer, scope) {
  const stats = analyzePngVisualContent(buffer);
  assert(
    stats.width >= 320 && stats.height >= 480,
    `${scope} screenshot dimensions are unexpectedly small: ${stats.width}x${stats.height}`,
  );
  assert(
    stats.colorBucketCount >= 8,
    `${scope} screenshot looks visually blank: only ${stats.colorBucketCount} color buckets`,
  );
  assert(
    stats.nonBackgroundRatio >= 0.005,
    `${scope} screenshot has too little non-background content: ${stats.nonBackgroundRatio.toFixed(
      4,
    )}`,
  );
  assert(
    stats.darkPixelRatio >= 0.0005,
    `${scope} screenshot has too little text/detail contrast: ${stats.darkPixelRatio.toFixed(
      4,
    )}`,
  );
  return stats;
}

export async function assertRouteVisualState(page, scope) {
  const layout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const scrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    );
    const main = document.querySelector("main");
    const mainRect = main?.getBoundingClientRect();
    const visibleTextLength = Array.from(document.body.querySelectorAll("*"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => element.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim().length;

    return {
      viewportWidth,
      viewportHeight,
      scrollWidth,
      mainVisible:
        Boolean(mainRect) &&
        mainRect.width >= Math.min(280, viewportWidth - 24) &&
        mainRect.height >= 240,
      visibleTextLength,
    };
  });

  assert(
    layout.scrollWidth <= layout.viewportWidth + 2,
    `${scope} has horizontal overflow: viewport=${layout.viewportWidth}, scroll=${layout.scrollWidth}`,
  );
  assert(layout.mainVisible, `${scope} main content is not visibly framed.`);
  assert(
    layout.visibleTextLength >= 120,
    `${scope} rendered too little visible text: ${layout.visibleTextLength}`,
  );

  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    type: "png",
  });
  return assertPngHasVisualContent(screenshot, scope);
}
