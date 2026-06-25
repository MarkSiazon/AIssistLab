import { SkillsImportDuplicateControls } from "@/components/skills/SkillsImportDuplicateControls";
import { SkillsImportPreviewRow } from "@/components/skills/SkillsImportPreviewRow";
import { countLabel } from "@/lib/format/count-label";
import type { SkillsImportPreviewSummary } from "@/lib/ui/skills-import-preview-summary";
import type { SkillsImportActionState } from "@/lib/ui/skills-import-action";
import {
  buildSkillsImportStats,
  hiddenPreviewSkillMessage,
  hiddenPreviewWarningMessage,
  importChipClass,
  type ImportPreview,
  type ImportPreviewItem,
  type SkillsImportDuplicateStrategy,
} from "@/lib/ui/skills-import-panel-model";

interface SkillsImportPreviewCardProps {
  preview: ImportPreview;
  previewSummary: SkillsImportPreviewSummary | null;
  visiblePreviewSkills: ImportPreviewItem[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  warningCount: number;
  duplicateStrategy: SkillsImportDuplicateStrategy;
  overwriteConfirmText: string;
  importAction: SkillsImportActionState;
  onDuplicateStrategyChange: (value: SkillsImportDuplicateStrategy) => void;
  onOverwriteConfirmTextChange: (value: string) => void;
  onApplyImport: () => void;
}

export function SkillsImportPreviewCard({
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
  onDuplicateStrategyChange,
  onOverwriteConfirmTextChange,
  onApplyImport,
}: SkillsImportPreviewCardProps) {
  const hiddenWarnings = hiddenPreviewWarningMessage({
    totalCount: preview.warnings.length,
    visibleCount: 3,
  });
  const hiddenSkills = hiddenPreviewSkillMessage({
    totalCount: preview.skills.length,
    visibleCount: visiblePreviewSkills.length,
  });

  return (
    <section className="skills-import-preview-card" aria-label="Import preview">
      <div className="skills-import-preview-header">
        <div className="skills-import-preview-copy">
          <div className="skills-section-kicker">Preview result</div>
          <div className="skills-import-preview-title">
            {countLabel(preview.skills.length, "skill")} found
          </div>
        </div>
        <span
          className={`skills-import-overall-chip ${importChipClass(
            previewSummary?.statusTone,
          )}`}
        >
          {previewSummary?.statusLabel ?? "Ready"}
        </span>
      </div>

      {previewSummary && (
        <div
          className={`skills-import-summary skills-import-summary-${previewSummary.statusTone}`}
        >
          <div className="skills-import-summary-copy">
            <div className="skills-import-summary-headline">
              {previewSummary.headline}
            </div>
            <div className="skills-import-summary-detail">
              {previewSummary.detail}
            </div>
          </div>
          <span className="skills-import-summary-action">
            {previewSummary.nextAction}
          </span>
        </div>
      )}

      <div className="skills-import-source" title={preview.sourceDisplay}>
        Source: {preview.sourceDisplay}
      </div>

      <div className="skills-import-stats" aria-label="Import preview summary">
        {buildSkillsImportStats({
          validCount,
          invalidCount,
          duplicateCount,
          warningCount,
        }).map(([label, value]) => (
          <div key={label} className="skills-import-stat">
            <div className="skills-import-stat-value">{value}</div>
            <div className="skills-import-stat-label">{label}</div>
          </div>
        ))}
      </div>

      {preview.warnings.length > 0 && (
        <div className="skills-import-warning-list" role="status">
          {preview.warnings.slice(0, 3).map((warning) => (
            <div key={warning} className="skills-import-warning">
              {warning}
            </div>
          ))}
          {hiddenWarnings && (
            <div className="skills-import-warning">{hiddenWarnings}</div>
          )}
        </div>
      )}

      <div className="skills-import-skill-list" aria-label="Previewed skills">
        {visiblePreviewSkills.map((item) => (
          <SkillsImportPreviewRow key={item.name} item={item} />
        ))}
        {hiddenSkills && (
          <div className="skills-import-more">{hiddenSkills}</div>
        )}
      </div>

      <SkillsImportDuplicateControls
        duplicateStrategy={duplicateStrategy}
        overwriteConfirmText={overwriteConfirmText}
        importAction={importAction}
        onDuplicateStrategyChange={onDuplicateStrategyChange}
        onOverwriteConfirmTextChange={onOverwriteConfirmTextChange}
        onApplyImport={onApplyImport}
      />
    </section>
  );
}
