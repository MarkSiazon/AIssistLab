import type { SkillsImportPreviewRequest } from "@/lib/skills/client-api";
import type { SkillsImportSourceType } from "@/lib/ui/skills-import-panel-model";

interface SkillsImportSourceValueInput {
  sourceType: SkillsImportSourceType;
  folderPath: string;
  archiveBase64: string;
  githubUrl: string;
}

interface SkillsImportPreviewRequestInput
  extends SkillsImportSourceValueInput {
  archiveName: string;
}

export function importSourceHasValue(
  input: SkillsImportSourceValueInput,
): boolean {
  if (input.sourceType === "folder") return input.folderPath.trim().length > 0;
  if (input.sourceType === "archive") {
    return input.archiveBase64.trim().length > 0;
  }
  return input.githubUrl.trim().length > 0;
}

export function buildImportPreviewRequest(
  input: SkillsImportPreviewRequestInput,
): SkillsImportPreviewRequest {
  if (input.sourceType === "folder") {
    return { sourceType: "folder", path: input.folderPath };
  }

  if (input.sourceType === "archive") {
    return {
      sourceType: "archive",
      archiveBase64: input.archiveBase64,
      fileName: input.archiveName,
    };
  }

  return { sourceType: "github", url: input.githubUrl };
}

export async function readFileAsBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return dataUrl.split(",")[1] ?? "";
}
