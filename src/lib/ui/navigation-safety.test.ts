import assert from "node:assert/strict";
import path from "node:path";
import {
  collectFilesByExtension,
  lineNumber,
  readSource,
  relativeSourcePath,
} from "@/lib/test-utils/static-source";

const sourceRoots = ["src/app", "src/components", "src/hooks", "src/lib"];
const allowedDirectNavigationFiles = new Set([
  path.join("src", "lib", "ui", "safe-navigation.ts"),
]);
const forbiddenPatterns = [
  {
    pattern: /\b(?:window\.)?location\.href\s*=/g,
    label: "direct location.href assignment",
  },
  {
    pattern: /\b(?:window\.)?location\.(?:assign|replace)\s*\(/g,
    label: "direct location navigation call",
  },
  {
    pattern: /\bwindow\.open\s*\(/g,
    label: "direct window.open call",
  },
] as const;

function readCallArgument(
  source: string,
  startIndex: number,
): string | null {
  let depth = 1;
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, index).trim();
    }
  }

  return null;
}

function isSafeRouterArgument(argument: string): boolean {
  if (/^["']\/(?!\/)[^"']*["']$/.test(argument)) return true;
  return /^skillEditorHref\(/.test(argument);
}

const files = sourceRoots.flatMap((root) => [
  ...collectFilesByExtension(path.join(process.cwd(), root), ".ts"),
  ...collectFilesByExtension(path.join(process.cwd(), root), ".tsx"),
]);
const issues: string[] = [];

for (const file of files) {
  const relativePath = relativeSourcePath(file);
  if (allowedDirectNavigationFiles.has(relativePath)) continue;

  const source = readSource(file);
  for (const { pattern, label } of forbiddenPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) {
      issues.push(`${relativePath}:${lineNumber(source, match.index)} ${label}`);
    }
  }

  const routerPattern = /\brouter\.(?:push|replace)\s*\(/g;
  let routerMatch: RegExpExecArray | null;
  while ((routerMatch = routerPattern.exec(source))) {
    const argument = readCallArgument(source, routerPattern.lastIndex);
    if (!argument || !isSafeRouterArgument(argument)) {
      issues.push(
        `${relativePath}:${lineNumber(
          source,
          routerMatch.index,
        )} router navigation should use a literal internal route or a safe route helper`,
      );
    }
  }
}

assert.deepEqual(
  issues,
  [],
  `Navigation should go through safe helpers instead of direct browser globals:\n${issues.join("\n")}`,
);

console.log("Navigation safety tests passed");
