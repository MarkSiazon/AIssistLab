import assert from "node:assert/strict";
import {
  collectTsxFiles,
  readSource,
  relativeSourcePath,
} from "@/lib/test-utils/static-source";

function findButtonsWithoutType(filePath: string): string[] {
  const source = readSource(filePath);
  const matches: string[] = [];
  const buttonPattern = /<button\b[\s\S]*?>/g;
  let match: RegExpExecArray | null;

  while ((match = buttonPattern.exec(source))) {
    const tag = match[0];
    if (/\btype\s*=/.test(tag)) continue;

    const line = source.slice(0, match.index).split(/\r?\n/).length;
    const relativePath = relativeSourcePath(filePath);
    matches.push(`${relativePath}:${line}`);
  }

  return matches;
}

const missingTypes = collectTsxFiles("src/app", "src/components").flatMap(
  findButtonsWithoutType,
);

assert.deepEqual(
  missingTypes,
  [],
  `Component buttons must declare type="button" or an explicit submit/reset type:\n${missingTypes.join("\n")}`,
);

console.log("Button type tests passed");
