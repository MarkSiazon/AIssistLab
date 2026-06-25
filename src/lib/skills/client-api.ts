import { jsonRequestInit, requestJson } from "@/lib/api/client";
import {
  API_ROUTES,
  apiSkillRestoreRoute,
  apiSkillRoute,
} from "@/lib/routes/api-routes";
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
    API_ROUTES.index,
    { method: "POST" },
    "Index rebuild failed.",
  );
}

export async function fetchSkillBody(name: string): Promise<string> {
  const payload = await requestJson<SkillBodyResponse>(
    apiSkillRoute(name),
    undefined,
    "Unable to load skill preview.",
  );
  return typeof payload.body === "string" ? payload.body : "";
}

export async function deleteSkillByName(name: string): Promise<void> {
  await requestJson(
    apiSkillRoute(name),
    jsonRequestInit("DELETE", { confirmName: name }),
    "Delete failed.",
  );
}

export async function restoreDeletedSkill(name: string): Promise<void> {
  await requestJson(
    apiSkillRestoreRoute(name),
    { method: "POST" },
    "Restore failed.",
  );
}

export async function previewSkillsImport(
  body: SkillsImportPreviewRequest,
): Promise<SkillImportPreview> {
  return requestJson<SkillImportPreview>(
    API_ROUTES.skillsImportPreview,
    jsonRequestInit("POST", body),
    "Import preview failed.",
  );
}

export async function applySkillsImport(input: {
  previewId: string;
  duplicateStrategy: DuplicateStrategy;
}): Promise<SkillsImportApplyResponse> {
  return requestJson<SkillsImportApplyResponse>(
    API_ROUTES.skillsImportApply,
    jsonRequestInit("POST", {
      previewId: input.previewId,
      confirm: true,
      duplicateStrategy: input.duplicateStrategy,
    }),
    "Import apply failed.",
  );
}
