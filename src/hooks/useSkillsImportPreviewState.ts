"use client";

import { useState } from "react";
import { buildSkillsImportActionState } from "@/lib/ui/skills-import-action";
import { buildSkillsImportPreviewActionState } from "@/lib/ui/skills-import-preview-action";
import { buildSkillsImportPreviewSummary } from "@/lib/ui/skills-import-preview-summary";
import type {
  ImportPreview,
  SkillsImportDuplicateStrategy,
  SkillsImportSourceType,
} from "@/lib/ui/skills-import-panel-model";

interface SkillsImportPreviewStateInput {
  sourceType: SkillsImportSourceType;
  hasSource: boolean;
  importLoading: boolean;
}

export function useSkillsImportPreviewState({
  sourceType,
  hasSource,
  importLoading,
}: SkillsImportPreviewStateInput) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<SkillsImportDuplicateStrategy>("skip");
  const [overwriteConfirmText, setOverwriteConfirmText] = useState("");

  const duplicateCount =
    preview?.skills.filter((item) => item.duplicate).length ?? 0;
  const validCount =
    preview?.skills.filter((item) => item.validationErrors.length === 0)
      .length ?? 0;
  const invalidCount =
    preview?.skills.filter((item) => item.validationErrors.length > 0)
      .length ?? 0;
  const qualityWarningCount =
    preview?.skills.reduce(
      (count, item) => count + item.qualityWarnings.length,
      0,
    ) ?? 0;
  const warningCount = qualityWarningCount + (preview?.warnings.length ?? 0);
  const visiblePreviewSkills = preview?.skills.slice(0, 5) ?? [];
  const previewSummary = preview
    ? buildSkillsImportPreviewSummary({
        totalCount: preview.skills.length,
        validCount,
        invalidCount,
        duplicateCount,
        warningCount,
      })
    : null;
  const previewAction = buildSkillsImportPreviewActionState({
    sourceType,
    hasSource,
    isLoading: importLoading,
    hasPreview: Boolean(preview),
  });
  const importAction = buildSkillsImportActionState({
    hasPreview: Boolean(preview),
    previewOk: preview?.ok === true,
    isLoading: importLoading,
    validationErrorCount: invalidCount,
    duplicateCount,
    validCount,
    duplicateStrategy,
    overwriteConfirmText,
  });

  function clearPreview() {
    setPreview(null);
    setOverwriteConfirmText("");
  }

  function setDuplicateStrategyAndResetConfirm(
    value: SkillsImportDuplicateStrategy,
  ) {
    setDuplicateStrategy(value);
    setOverwriteConfirmText("");
  }

  return {
    clearPreview,
    duplicateCount,
    duplicateStrategy,
    importAction,
    invalidCount,
    overwriteConfirmText,
    preview,
    previewAction,
    previewSummary,
    setDuplicateStrategy: setDuplicateStrategyAndResetConfirm,
    setOverwriteConfirmText,
    setPreview,
    validCount,
    visiblePreviewSkills,
    warningCount,
  };
}
