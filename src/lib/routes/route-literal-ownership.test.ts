import assert from "node:assert/strict";
import path from "node:path";
import {
  collectSourceFiles,
  lineNumber,
  readSource,
  relativeSourcePath,
} from "@/lib/test-utils/static-source";

const routeSourceRoots = ["src/app", "src/components", "src/hooks", "src/lib"];
const allowedRouteLiteralFiles = new Set([
  path.join("src", "lib", "routes", "api-routes.ts"),
  path.join("src", "lib", "routes", "app-routes.ts"),
]);

const appRouteLiteralPattern =
  /(?:["'`])\/(?:chat|editor|export|settings|skills)(?:[/?#][^"'`\\]*)?(?:["'`])/g;
const apiRouteLiteralPattern = /(?:["'`])\/api\/[^"'`\\]*(?:["'`])/g;

const files = routeSourceRoots
  .flatMap((root) => collectSourceFiles([root], [".ts", ".tsx"]))
  .filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"));

const issues: string[] = [];

for (const file of files) {
  const relativePath = relativeSourcePath(file);
  if (allowedRouteLiteralFiles.has(relativePath)) continue;

  const source = readSource(file);
  for (const pattern of [appRouteLiteralPattern, apiRouteLiteralPattern]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) {
      issues.push(
        `${relativePath}:${lineNumber(source, match.index)} repeats route literal ${match[0]}`,
      );
    }
  }
}

assert.deepEqual(
  issues,
  [],
  `First-party app and API route literals should be owned by src/lib/routes:\n${issues.join("\n")}`,
);

console.log("Route literal ownership tests passed");
