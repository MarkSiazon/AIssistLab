import type {
  GuidedSkillDraftInput,
  NormalizedGuidedInput,
} from "@/lib/skills/guided-builder-types";

const MAX_FIELD_LENGTH = 600;
const MAX_ITEMS = 8;

function sanitizeText(value: string): string {
  return value
    .replace(/[A-Z]:\\Users\\[^\\\s"]+/gi, "~")
    .replace(/[A-Z]:\/Users\/[^/\s"]+/gi, "~")
    .replace(/\/Users\/[^/\s"]+/gi, "~")
    .replace(/\/home\/[^/\s"]+/gi, "~")
    .replace(/[^\s\\/@]+@[^\s\\/]+\.[^\s\\/]+/gi, "[redacted-email]")
    .replace(/\b(Bearer|token)\s+[a-z0-9._-]+/gi, "$1 [redacted]")
    .replace(/\bsk-[a-z0-9_-]+/gi, "[redacted-key]")
    .replace(/\boauth[^\s\\/"]*/gi, "[redacted-auth-file]")
    .trim();
}

function normalizeItem(value: unknown): string {
  return sanitizeText(String(value ?? ""))
    .replace(/\s+/g, " ")
    .slice(0, MAX_FIELD_LENGTH);
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeItem).filter(Boolean).slice(0, MAX_ITEMS);
}

export function normalizeGuidedSkillDraftInput(
  value: Partial<GuidedSkillDraftInput>,
): NormalizedGuidedInput {
  return {
    purpose: normalizeItem(value.purpose),
    audience: normalizeItem(value.audience),
    triggerExamples: normalizeList(value.triggerExamples),
    requiredInputs: normalizeList(value.requiredInputs),
    boundaries: normalizeList(value.boundaries),
    successCriteria: normalizeList(value.successCriteria),
    templateId: normalizeItem(value.templateId).toLowerCase(),
  };
}
