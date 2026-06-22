import assert from "node:assert/strict";
import {
  collectTsxFiles,
  lineNumber,
  readSource,
  relativeSourcePath,
} from "@/lib/test-utils/static-source";

function collectLiteralIds(source: string): Set<string> {
  const ids = new Set<string>();
  const idPattern = /\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*["']([^"']+)["']\s*\})/g;
  let match: RegExpExecArray | null;

  while ((match = idPattern.exec(source))) {
    ids.add(match[1] ?? match[2] ?? match[3]);
  }

  return ids;
}

function literalIdTokens(value: string): string[] {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(token));
}

function readQuoted(source: string, start: number): { value: string; end: number } {
  const quote = source[start];
  let value = "";
  let index = start + 1;

  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      value += source[index + 1] ?? "";
      index += 2;
      continue;
    }
    if (char === quote) return { value, end: index + 1 };
    value += char;
    index += 1;
  }

  return { value, end: index };
}

function readTemplateExpression(
  source: string,
  start: number,
): { tokens: string[]; end: number } {
  const tokens: string[] = [];
  let depth = 1;
  let index = start;

  while (index < source.length && depth > 0) {
    const char = source[index];

    if (char === '"' || char === "'") {
      const quoted = readQuoted(source, index);
      tokens.push(...literalIdTokens(quoted.value));
      index = quoted.end;
      continue;
    }

    if (char === "`") {
      const template = readTemplate(source, index);
      tokens.push(...template.tokens);
      index = template.end;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    index += 1;
  }

  return { tokens, end: index };
}

function readTemplate(
  source: string,
  start: number,
): { tokens: string[]; end: number } {
  const tokens: string[] = [];
  let chunkStart = start + 1;
  let index = start + 1;

  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }

    if (source[index] === "`") {
      tokens.push(...literalIdTokens(source.slice(chunkStart, index)));
      return { tokens, end: index + 1 };
    }

    if (source[index] === "$" && source[index + 1] === "{") {
      tokens.push(...literalIdTokens(source.slice(chunkStart, index)));
      const expression = readTemplateExpression(source, index + 2);
      tokens.push(...expression.tokens);
      index = expression.end;
      chunkStart = index;
      continue;
    }

    index += 1;
  }

  tokens.push(...literalIdTokens(source.slice(chunkStart, index)));
  return { tokens, end: index };
}

function collectLiteralAriaRefs(source: string): Array<{
  attribute: string;
  value: string;
  index: number;
}> {
  const refs: Array<{ attribute: string; value: string; index: number }> = [];
  const refPattern = /\b(aria-describedby|aria-labelledby|aria-controls)\s*=/g;
  let match: RegExpExecArray | null;

  while ((match = refPattern.exec(source))) {
    let valueStart = refPattern.lastIndex;
    while (/\s/.test(source[valueStart] ?? "")) valueStart += 1;

    if (source[valueStart] === '"' || source[valueStart] === "'") {
      const quoted = readQuoted(source, valueStart);
      refs.push({
        attribute: match[1],
        value: quoted.value,
        index: match.index,
      });
      continue;
    }

    if (source[valueStart] !== "{") continue;
    valueStart += 1;
    while (/\s/.test(source[valueStart] ?? "")) valueStart += 1;

    if (source[valueStart] === '"' || source[valueStart] === "'") {
      const quoted = readQuoted(source, valueStart);
      refs.push({
        attribute: match[1],
        value: quoted.value,
        index: match.index,
      });
      continue;
    }

    if (source[valueStart] !== "`") continue;
    const template = readTemplate(source, valueStart);
    refs.push({
      attribute: match[1],
      value: template.tokens.join(" "),
      index: match.index,
    });
  }

  return refs;
}

const files = collectTsxFiles("src/app", "src/components");
const literalIds = collectLiteralIds(
  files.map((file) => readSource(file)).join("\n"),
);
const issues: string[] = [];

for (const file of files) {
  const source = readSource(file);
  const relativePath = relativeSourcePath(file);

  for (const ref of collectLiteralAriaRefs(source)) {
    for (const targetId of ref.value.split(/\s+/).filter(Boolean)) {
      if (!literalIds.has(targetId)) {
        issues.push(
          `${relativePath}:${lineNumber(source, ref.index)} ${ref.attribute} references missing #${targetId}`,
        );
      }
    }
  }
}

assert.deepEqual(
  issues,
  [],
  `Literal ARIA references should point to existing literal IDs:\n${issues.join("\n")}`,
);

console.log("ARIA reference tests passed");
