import assert from "node:assert/strict";
import {
  collectTsxFiles,
  lineNumber,
  readSource,
  relativeSourcePath,
} from "@/lib/test-utils/static-source";

const files = collectTsxFiles("src/app", "src/components");
const issues: string[] = [];
const idPattern = /\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*["']([^"']+)["']\s*\})/g;

for (const file of files) {
  const source = readSource(file);
  const relativePath = relativeSourcePath(file);
  const seen = new Map<string, number>();
  let match: RegExpExecArray | null;

  while ((match = idPattern.exec(source))) {
    const id = match[1] ?? match[2] ?? match[3];
    const line = lineNumber(source, match.index);
    const firstLine = seen.get(id);

    if (firstLine) {
      issues.push(
        `${relativePath}:${line} duplicates literal id #${id}; first seen on line ${firstLine}`,
      );
    } else {
      seen.set(id, line);
    }
  }
}

assert.deepEqual(
  issues,
  [],
  `Literal IDs should be unique within each TSX file:\n${issues.join("\n")}`,
);

console.log("Literal ID uniqueness tests passed");
