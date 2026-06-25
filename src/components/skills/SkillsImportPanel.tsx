import { SkillsImportPreviewCard } from "@/components/skills/SkillsImportPreviewCard";
import { SkillsImportSourceFields } from "@/components/skills/SkillsImportSourceFields";
import { SkillsRestoreAction } from "@/components/skills/SkillsRestoreAction";
import type { SkillRestoreActionState } from "@/lib/ui/skill-restore-action";
import type { SkillsImportActionState } from "@/lib/ui/skills-import-action";
import type { SkillsImportPreviewActionState } from "@/lib/ui/skills-import-preview-action";
import type { SkillsImportPreviewSummary } from "@/lib/ui/skills-import-preview-summary";
import type {
  DeletedSkillSummary,
  ImportPreview,
  ImportPreviewItem,
  SkillsImportDuplicateStrategy,
  SkillsImportSourceType,
} from "@/lib/ui/skills-import-panel-model";

interface SkillsImportPanelProps {
  latestDeleted?: DeletedSkillSummary | null;
  restoreAction: SkillRestoreActionState;
  sourceType: SkillsImportSourceType;
  folderPath: string;
  githubUrl: string;
  previewAction: SkillsImportPreviewActionState;
  preview: ImportPreview | null;
  previewSummary: SkillsImportPreviewSummary | null;
  visiblePreviewSkills: ImportPreviewItem[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  warningCount: number;
  duplicateStrategy: SkillsImportDuplicateStrategy;
  overwriteConfirmText: string;
  importAction: SkillsImportActionState;
  lifecycleMessage: string | null;
  onRestoreLatestDeleted: () => void;
  onSourceTypeChange: (value: SkillsImportSourceType) => void;
  onFolderPathChange: (value: string) => void;
  onGithubUrlChange: (value: string) => void;
  onArchiveFileChange: (file: File | null) => void;
  onPreviewImport: () => void;
  onDuplicateStrategyChange: (value: SkillsImportDuplicateStrategy) => void;
  onOverwriteConfirmTextChange: (value: string) => void;
  onApplyImport: () => void;
}

export function SkillsImportPanel({
  latestDeleted,
  restoreAction,
  sourceType,
  folderPath,
  githubUrl,
  previewAction,
  preview,
  previewSummary,
  visiblePreviewSkills,
  validCount,
  invalidCount,
  duplicateCount,
  warningCount,
  duplicateStrategy,
  overwriteConfirmText,
  importAction,
  lifecycleMessage,
  onRestoreLatestDeleted,
  onSourceTypeChange,
  onFolderPathChange,
  onGithubUrlChange,
  onArchiveFileChange,
  onPreviewImport,
  onDuplicateStrategyChange,
  onOverwriteConfirmTextChange,
  onApplyImport,
}: SkillsImportPanelProps) {
  return (
    <div
      id="skills-import-panel"
      className="px-3 py-3 border-b flex flex-col gap-2"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Import Preview
        </div>
        <SkillsRestoreAction
          latestDeleted={latestDeleted}
          restoreAction={restoreAction}
          onRestoreLatestDeleted={onRestoreLatestDeleted}
        />
      </div>

      <SkillsImportSourceFields
        sourceType={sourceType}
        folderPath={folderPath}
        githubUrl={githubUrl}
        onSourceTypeChange={onSourceTypeChange}
        onFolderPathChange={onFolderPathChange}
        onGithubUrlChange={onGithubUrlChange}
        onArchiveFileChange={onArchiveFileChange}
      />

      <button
        type="button"
        onClick={onPreviewImport}
        disabled={!previewAction.canPreview}
        aria-label={previewAction.ariaLabel}
        aria-describedby="skills-import-readiness"
        title={previewAction.readinessMessage}
        className="ui-button ui-button-secondary text-xs"
      >
        {previewAction.buttonLabel}
      </button>
      <div
        id="skills-import-readiness"
        className={`skills-import-readiness skills-import-readiness-${previewAction.readinessTone}`}
        role="status"
        aria-live="polite"
      >
        {previewAction.readinessMessage}
      </div>

      {preview && (
        <SkillsImportPreviewCard
          preview={preview}
          previewSummary={previewSummary}
          visiblePreviewSkills={visiblePreviewSkills}
          validCount={validCount}
          invalidCount={invalidCount}
          duplicateCount={duplicateCount}
          warningCount={warningCount}
          duplicateStrategy={duplicateStrategy}
          overwriteConfirmText={overwriteConfirmText}
          importAction={importAction}
          onDuplicateStrategyChange={onDuplicateStrategyChange}
          onOverwriteConfirmTextChange={onOverwriteConfirmTextChange}
          onApplyImport={onApplyImport}
        />
      )}

      {lifecycleMessage && (
        <div
          className="text-xs"
          role="status"
          aria-live="polite"
          style={{ color: "var(--text-muted)" }}
        >
          {lifecycleMessage}
        </div>
      )}
    </div>
  );
}
