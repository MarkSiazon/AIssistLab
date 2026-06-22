import type {
  ClaudeProjectInventoryCheck,
  ClaudeProjectInventoryStatus,
} from "@/lib/claude/project-inventory-types";

function ellipsizeAbsoluteProjectPath(value: string): string {
  if (value.startsWith("~")) return value;
  if (!/^(?:[A-Z]:\/|\/)/i.test(value)) return value;

  const parts = value.split("/").filter(Boolean);
  const pathParts = /^[A-Z]:$/i.test(parts[0] ?? "") ? parts.slice(1) : parts;
  const tail = pathParts.slice(-3);

  return tail.length > 0 ? `.../${tail.join("/")}` : ".../";
}

export function sanitizeProjectText(value: string): string {
  const sanitized = value
    .replace(/\\/g, "/")
    .replace(/[A-Z]:\/Users\/[^/\s"]+/gi, "~")
    .replace(/\/Users\/[^/\s"]+/gi, "~")
    .replace(/\/home\/[^/\s"]+/gi, "~")
    .replace(/[^\s\\/@]+@[^\s\\/]+\.[^\s\\/]+/gi, "[redacted-email]")
    .replace(/\bsk-[a-z0-9_-]+/gi, "[redacted-key]")
    .replace(/\b(Bearer|token)\s+[a-z0-9._-]+/gi, "$1 [redacted]");

  return ellipsizeAbsoluteProjectPath(sanitized);
}

export function projectInventoryCheck(
  id: string,
  status: ClaudeProjectInventoryStatus,
  title: string,
  message: string,
  suggestedFix?: string,
): ClaudeProjectInventoryCheck {
  return {
    id,
    status,
    title,
    message: sanitizeProjectText(message),
    suggestedFix: suggestedFix ? sanitizeProjectText(suggestedFix) : undefined,
  };
}
