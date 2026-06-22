import type { SkillFrontmatter } from "@/types/skill";
import type { SkillQualityIssue } from "./quality";
import type { SkillValidationError } from "./validation";

export type SkillImportSource =
  | { sourceType: "folder"; path: string }
  | { sourceType: "archive"; archiveBase64: string; fileName?: string }
  | { sourceType: "github"; url: string };

export type DuplicateStrategy = "skip" | "overwrite" | "rename";

export interface SkillImportPreviewItem {
  name: string;
  displayName: string;
  hasSkillFile: boolean;
  fileCount: number;
  validationErrors: SkillValidationError[];
  qualityWarnings: SkillQualityIssue[];
  duplicate: boolean;
}

export interface SkillImportPreview {
  ok: boolean;
  previewId: string;
  sourceType: SkillImportSource["sourceType"];
  sourceDisplay: string;
  skills: SkillImportPreviewItem[];
  warnings: string[];
}

export interface ImportCandidate {
  name: string;
  displayName: string;
  fileCount: number;
  frontmatter: SkillFrontmatter;
  frontmatterParseError?: string | null;
  body: string;
  raw: string;
}

export interface StoredPreview extends SkillImportPreview {
  candidates: ImportCandidate[];
}

export const MAX_FILE_BYTES = 500_000;
export const MAX_ARCHIVE_BYTES = 5_000_000;
export const MAX_IMPORT_FILES = 100;
