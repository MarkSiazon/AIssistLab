"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  applySkillsImport,
  previewSkillsImport,
} from "@/lib/skills/client-api";
import { buildImportAppliedMessage } from "@/lib/ui/skills-page-model";
import {
  buildImportPreviewRequest,
  importSourceHasValue,
  readFileAsBase64,
} from "@/hooks/skills-import-source";
import { useSkillRestoreWorkflow } from "@/hooks/useSkillRestoreWorkflow";
import { useSkillsImportPreviewState } from "@/hooks/useSkillsImportPreviewState";
import type {
  DeletedSkillSummary,
  SkillsImportDuplicateStrategy,
  SkillsImportSourceType,
} from "@/lib/ui/skills-import-panel-model";

interface SkillsImportControllerInput {
  latestDeleted?: DeletedSkillSummary | null;
  lifecycleMessage: string | null;
  setLifecycleMessage: Dispatch<SetStateAction<string | null>>;
  refreshLibraryState: () => Promise<void>;
  selectSkill: (name: string) => Promise<void>;
}

export function useSkillsImportController({
  latestDeleted,
  lifecycleMessage,
  setLifecycleMessage,
  refreshLibraryState,
  selectSkill,
}: SkillsImportControllerInput) {
  const [sourceType, setSourceType] = useState<SkillsImportSourceType>("folder");
  const [folderPath, setFolderPath] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [archiveName, setArchiveName] = useState("");
  const [archiveBase64, setArchiveBase64] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const hasSource = importSourceHasValue({
    sourceType,
    folderPath,
    archiveBase64,
    githubUrl,
  });

  const importPreview = useSkillsImportPreviewState({
    sourceType,
    hasSource,
    importLoading,
  });
  const restoreWorkflow = useSkillRestoreWorkflow({
    latestDeleted,
    setLifecycleMessage,
    refreshLibraryState,
    selectSkill,
  });

  function clearPreviewForSourceChange() {
    importPreview.clearPreview();
    setLifecycleMessage(null);
  }

  async function previewImport() {
    setImportLoading(true);
    setLifecycleMessage(null);
    importPreview.clearPreview();
    try {
      const payload = await previewSkillsImport(
        buildImportPreviewRequest({
          sourceType,
          folderPath,
          archiveBase64,
          archiveName,
          githubUrl,
        }),
      );
      importPreview.setPreview(payload);
      setLifecycleMessage("Import preview ready. No files have been written.");
    } catch (err) {
      setLifecycleMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportLoading(false);
    }
  }

  async function applyImport() {
    if (!importPreview.preview) return;
    setImportLoading(true);
    try {
      const payload = await applySkillsImport({
        previewId: importPreview.preview.previewId,
        duplicateStrategy: importPreview.duplicateStrategy,
      });
      setLifecycleMessage(
        buildImportAppliedMessage({
          skippedCount: Array.isArray(payload.skipped)
            ? payload.skipped.length
            : 0,
          renamedCount: Array.isArray(payload.renamed)
            ? payload.renamed.length
            : 0,
          writtenCount: Array.isArray(payload.written)
            ? payload.written.length
            : 0,
        }),
      );
      importPreview.clearPreview();
      await refreshLibraryState();
    } catch (err) {
      setLifecycleMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportLoading(false);
    }
  }

  async function handleArchiveFile(file: File | null) {
    clearPreviewForSourceChange();
    if (!file) {
      setArchiveName("");
      setArchiveBase64("");
      return;
    }
    setArchiveName(file.name);
    setArchiveBase64(await readFileAsBase64(file));
  }

  return {
    latestDeleted,
    restoreAction: restoreWorkflow.restoreAction,
    sourceType,
    folderPath,
    githubUrl,
    previewAction: importPreview.previewAction,
    preview: importPreview.preview,
    previewSummary: importPreview.previewSummary,
    visiblePreviewSkills: importPreview.visiblePreviewSkills,
    validCount: importPreview.validCount,
    invalidCount: importPreview.invalidCount,
    duplicateCount: importPreview.duplicateCount,
    warningCount: importPreview.warningCount,
    duplicateStrategy: importPreview.duplicateStrategy,
    overwriteConfirmText: importPreview.overwriteConfirmText,
    importAction: importPreview.importAction,
    lifecycleMessage,
    restoreLatestDeleted: restoreWorkflow.restoreLatestDeleted,
    setSourceType: (value: SkillsImportSourceType) => {
      setSourceType(value);
      clearPreviewForSourceChange();
    },
    setFolderPath: (value: string) => {
      setFolderPath(value);
      clearPreviewForSourceChange();
    },
    setGithubUrl: (value: string) => {
      setGithubUrl(value);
      clearPreviewForSourceChange();
    },
    handleArchiveFile,
    previewImport,
    setDuplicateStrategy: (value: SkillsImportDuplicateStrategy) =>
      importPreview.setDuplicateStrategy(value),
    setOverwriteConfirmText: importPreview.setOverwriteConfirmText,
    applyImport,
  };
}
