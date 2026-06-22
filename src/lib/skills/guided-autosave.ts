export const GUIDED_FORM_AUTOSAVE_SCHEMA_VERSION = 1;
export const GUIDED_FORM_AUTOSAVE_MAX_LENGTH = 6000;
export const GUIDED_FORM_AUTOSAVE_STEP_COUNT = 4;

export interface GuidedFormSnapshotInput {
  step: number;
  templateId: string;
  purpose: string;
  audience: string;
  triggerExamples: string;
  requiredInputs: string;
  boundaries: string;
  successCriteria: string;
}

export interface GuidedFormSnapshot extends GuidedFormSnapshotInput {
  schemaVersion: typeof GUIDED_FORM_AUTOSAVE_SCHEMA_VERSION;
  updatedAt: string;
}

function normalizeString(value: unknown): string {
  return String(value ?? "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, GUIDED_FORM_AUTOSAVE_MAX_LENGTH);
}

function normalizeStep(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(
    GUIDED_FORM_AUTOSAVE_STEP_COUNT - 1,
    Math.max(0, Math.trunc(parsed)),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildGuidedFormSnapshot(
  input: GuidedFormSnapshotInput,
  now = new Date(),
): GuidedFormSnapshot {
  return {
    schemaVersion: GUIDED_FORM_AUTOSAVE_SCHEMA_VERSION,
    updatedAt: now.toISOString(),
    step: normalizeStep(input.step),
    templateId: normalizeString(input.templateId).toLowerCase(),
    purpose: normalizeString(input.purpose),
    audience: normalizeString(input.audience),
    triggerExamples: normalizeString(input.triggerExamples),
    requiredInputs: normalizeString(input.requiredInputs),
    boundaries: normalizeString(input.boundaries),
    successCriteria: normalizeString(input.successCriteria),
  };
}

export function parseGuidedFormSnapshot(raw: string | null): GuidedFormSnapshot | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.schemaVersion !== GUIDED_FORM_AUTOSAVE_SCHEMA_VERSION) return null;

    return buildGuidedFormSnapshot(
      {
        step: normalizeStep(parsed.step),
        templateId: normalizeString(parsed.templateId),
        purpose: normalizeString(parsed.purpose),
        audience: normalizeString(parsed.audience),
        triggerExamples: normalizeString(parsed.triggerExamples),
        requiredInputs: normalizeString(parsed.requiredInputs),
        boundaries: normalizeString(parsed.boundaries),
        successCriteria: normalizeString(parsed.successCriteria),
      },
      parsed.updatedAt ? new Date(normalizeString(parsed.updatedAt)) : new Date(),
    );
  } catch {
    return null;
  }
}

export function guidedFormHasContent(snapshot: GuidedFormSnapshotInput): boolean {
  return [
    snapshot.purpose,
    snapshot.audience,
    snapshot.triggerExamples,
    snapshot.requiredInputs,
    snapshot.boundaries,
    snapshot.successCriteria,
  ].some((value) => normalizeString(value).length > 0);
}
