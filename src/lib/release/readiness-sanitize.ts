import type { ReleaseReadinessSection } from "@/lib/release/readiness-types";

function ellipsizeAbsolutePath(value: string): string {
  if (value.startsWith("~")) return value;
  if (!/^(?:[A-Z]:[\\/]|\/)/i.test(value)) return value;

  const separator = value.includes("\\") ? "\\" : "/";
  const parts = value.split(/[\\/]+/).filter(Boolean);
  const pathParts = /^[A-Z]:$/i.test(parts[0] ?? "") ? parts.slice(1) : parts;
  const tail = pathParts.slice(-3);

  return tail.length > 0
    ? `...${separator}${tail.join(separator)}`
    : `...${separator}`;
}

export function sanitizeReleaseText(value: string): string {
  const sanitized = value
    .replace(/[A-Z]:\\Users\\[^\\\s"]+/gi, "~")
    .replace(/[A-Z]:\/Users\/[^/\s"]+/gi, "~")
    .replace(/[^\s\\/@]+@[^\s\\/]+\.[^\s\\/]+/gi, "[redacted-email]")
    .replace(/\.claude-profiles\\[^\s\\"]+/gi, ".claude-profiles\\<hidden>")
    .replace(/\.claude-profiles\/[^\s\/"]+/gi, ".claude-profiles/<hidden>")
    .replace(/\boauth[^\s\\"]*/gi, "[redacted]")
    .replace(/\bAuthorization:\s*[^\n\r]+/gi, "Authorization: [redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]+/gi, "[redacted]")
    .replace(/\b[A-Za-z0-9_-]*token[A-Za-z0-9_-]*\b/gi, "[redacted]");

  return ellipsizeAbsolutePath(sanitized);
}

export function sanitizeReleaseSection(
  input: ReleaseReadinessSection,
): ReleaseReadinessSection {
  return {
    ...input,
    message: sanitizeReleaseText(input.message),
  };
}
