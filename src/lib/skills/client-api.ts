import { jsonRequestInit, requestJson } from "@/lib/api/client";
import type {
  DuplicateStrategy,
  SkillImportPreview,
  SkillImportSource,
} from "@/lib/skills/importer-types";
import type { SkillLibraryIndexState } from "@/lib/skills/library-readiness";
import type { DeletedSkillSummary } from "@/lib/skills/trash";

export interface SkillsListResponse {
  skills: {
    name: string;
    description: string;
    tags: string[];
    updatedAt: string;
  }[];
  total: number;
  latestDeleted: DeletedSkillSummary | null;
}

interface SkillBodyResponse {
  body?: unknown;
}

export type SkillsImportPreviewRequest = SkillImportSource;

export interface SkillsImportApplyResponse {
  skipped?: unknown[];
  renamed?: unknown[];
  written?: unknown[];
}

export function fetchSkillsJson<T>(url: string): Promise<T> {
  return requestJson<T>(url, undefined, "Unable to load skills data.");
}

export async function rebuildSkillsIndex(): Promise<SkillLibraryIndexState> {
  return requestJson<SkillLibraryIndexState>(
    "/api/index",
    { method: "POST" },
    "Index rebuild failed.",
  );
}

export async function fetchSkillBody(name: string): Promise<string> {
  const payload = await requestJson<SkillBodyResponse>(
    `/api/skills/${encodeURIComponent(name)}`,
    undefined,
    "Unable to load skill preview.",
  );
  return typeof payload.body === "string" ? payload.body : "";
}

export async function deleteSkillByName(name: string): Promise<void> {
  await requestJson(
    `/api/skills/${encodeURIComponent(name)}`,
    jsonRequestInit("DELETE", { confirmName: name }),
    "Delete failed.",
  );
}

export async function restoreDeletedSkill(name: string): Promise<void> {
  await requestJson(
    `/api/skills/${encodeURIComponent(name)}/restore`,
    { method: "POST" },
    "Restore failed.",
  );
}

export async function previewSkillsImport(
  body: SkillsImportPreviewRequest,
): Promise<SkillImportPreview> {
  return requestJson<SkillImportPreview>(
    "/api/skills/import/preview",
    jsonRequestInit("POST", body),
    "Import preview failed.",
  );
}

export async function applySkillsImport(input: {
  previewId: string;
  duplicateStrategy: DuplicateStrategy;
}): Promise<SkillsImportApplyResponse> {
  return requestJson<SkillsImportApplyResponse>(
    "/api/skills/import/apply",
    jsonRequestInit("POST", {
      previewId: input.previewId,
      confirm: true,
      duplicateStrategy: input.duplicateStrategy,
    }),
    "Import apply failed.",
  );
}
