import assert from "node:assert/strict";
import path from "node:path";
import {
  collectTsxFiles,
  lineNumber,
  readSource,
  relativeSourcePath,
} from "@/lib/test-utils/static-source";
import { MAIN_CONTENT_ID } from "./route-announcement";

function collectLiteralIds(source: string): Set<string> {
  const ids = new Set<string>();
  const idPattern = /\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*["']([^"']+)["']\s*\})/g;
  let match: RegExpExecArray | null;

  while ((match = idPattern.exec(source))) {
    ids.add(match[1] ?? match[2] ?? match[3]);
  }

  return ids;
}

function collectLiteralHrefs(source: string): Array<{
  href: string;
  index: number;
}> {
  const hrefs: Array<{ href: string; index: number }> = [];
  const hrefPattern =
    /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})/g;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(source))) {
    hrefs.push({
      href: match[1] ?? match[2] ?? match[3],
      index: match.index,
    });
  }

  return hrefs;
}

function collectDynamicHrefs(source: string): Array<{
  expression: string;
  index: number;
}> {
  const hrefs: Array<{ expression: string; index: number }> = [];
  const hrefStartPattern = /\bhref\s*=\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = hrefStartPattern.exec(source))) {
    let depth = 1;
    let quote: "'" | '"' | "`" | null = null;
    let escaped = false;
    const startIndex = hrefStartPattern.lastIndex;

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
      if (char === "{") {
        depth += 1;
        continue;
      }
      if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          hrefs.push({
            expression: source.slice(startIndex, index).trim(),
            index: match.index,
          });
          hrefStartPattern.lastIndex = index + 1;
          break;
        }
      }
    }
  }

  return hrefs;
}

function isRouteHelperExpression(expression: string): boolean {
  return /^skill(?:Editor|Export)Href\(/.test(expression);
}

function isGuardedHrefExpression(source: string, expression: string): boolean {
  return source.includes(`isSafeInternalActionHref(${expression})`);
}

const files = collectTsxFiles("src/app", "src/components");
const allSource = files.map((file) => readSource(file)).join("\n");
const literalIds = collectLiteralIds(allSource);
literalIds.add(MAIN_CONTENT_ID);

const issues: string[] = [];

for (const file of files) {
  const source = readSource(file);
  const relativePath = relativeSourcePath(file).replace(/\\/g, "/");

  for (const { href, index } of collectLiteralHrefs(source)) {
    const location = `${relativePath}:${lineNumber(source, index)}`;

    if (!href.trim()) {
      issues.push(`${location} has an empty href`);
      continue;
    }

    if (href === "#") {
      issues.push(`${location} uses a raw # href`);
      continue;
    }

    if (/^javascript:/i.test(href)) {
      issues.push(`${location} uses a javascript href`);
      continue;
    }

    if (href.startsWith("#")) {
      const target = href.slice(1);
      if (!literalIds.has(target)) {
        issues.push(`${location} points to missing hash target #${target}`);
      }
    }
  }

  for (const { expression, index } of collectDynamicHrefs(source)) {
    const location = `${relativePath}:${lineNumber(source, index)}`;

    if (expression === "`#${MAIN_CONTENT_ID}`") continue;
    if (isRouteHelperExpression(expression)) continue;
    if (isGuardedHrefExpression(source, expression)) continue;

    if (expression === "item.href" && relativePath === "src/components/layout/Sidebar.tsx") {
      continue;
    }

    if (
      expression === "actionHref" &&
      relativePath === "src/components/skills/SkillLibraryReadinessPanel.tsx"
    ) {
      continue;
    }

    issues.push(
      `${location} uses dynamic href={${expression}} without a recognized safe route helper or isSafeInternalActionHref guard`,
    );
  }
}

const layoutSource = readSource(path.join(process.cwd(), "src/app/layout.tsx"));
assert.match(
  layoutSource,
  /href=\{`#\$\{MAIN_CONTENT_ID\}`\}/,
  "App layout should keep the skip link wired to MAIN_CONTENT_ID.",
);
assert.match(
  layoutSource,
  /id=\{MAIN_CONTENT_ID\}/,
  "App layout should keep the main element target wired to MAIN_CONTENT_ID.",
);

assert.deepEqual(
  issues,
  [],
  `Internal links should not use empty, javascript, raw #, or missing hash targets:\n${issues.join("\n")}`,
);

console.log("Internal link tests passed");
