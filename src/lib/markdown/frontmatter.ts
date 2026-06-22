import { dump, load } from "js-yaml";

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  content: string;
  error?: string;
}

const OPENING_FENCE_PATTERN = /^\uFEFF?---[ \t]*(?:\r?\n|$)/;
const CLOSING_FENCE_PATTERN = /(^|\r?\n)---[ \t]*(?:\r?\n|$)/;

function asPlainRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function frontmatterDataError(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "Frontmatter YAML must be an object.";
  }
  return undefined;
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (!value || typeof value !== "object") return value;

  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "undefined") continue;
    next[key] = stripUndefined(item);
  }
  return next;
}

export function parseFrontmatter(raw: string): ParsedFrontmatter {
  const opening = raw.match(OPENING_FENCE_PATTERN);
  if (!opening) return { data: {}, content: raw };

  const contentStart = opening[0].length;
  const rest = raw.slice(contentStart);
  const closing = rest.match(CLOSING_FENCE_PATTERN);
  if (!closing || typeof closing.index !== "number") {
    return { data: {}, content: raw };
  }

  const yamlEnd = contentStart + closing.index;
  const bodyStart = contentStart + closing.index + closing[0].length;
  const yamlText = raw.slice(contentStart, yamlEnd);
  let data: unknown = {};
  let error: string | undefined;
  try {
    data = yamlText.trim().length > 0 ? load(yamlText) : {};
  } catch {
    data = {};
    error = "Frontmatter YAML could not be parsed.";
  }
  error ??= frontmatterDataError(data);

  return {
    data: asPlainRecord(data),
    content: raw.slice(bodyStart),
    error,
  };
}

export function stringifyFrontmatter(
  content: string,
  data: Record<string, unknown>,
): string {
  const yamlText = dump(stripUndefined(data), {
    lineWidth: 100,
    noRefs: true,
    quotingType: '"',
    sortKeys: false,
  }).trimEnd();

  return `---\n${yamlText}\n---\n${content.trimStart()}`;
}
