import { buildSkillsImportPreviewRowState } from "@/lib/ui/skills-import-preview-row";
import {
  importChipClass,
  type ImportPreviewItem,
} from "@/lib/ui/skills-import-panel-model";

export function SkillsImportPreviewRow({ item }: { item: ImportPreviewItem }) {
  const rowState = buildSkillsImportPreviewRowState({
    displayName: item.displayName,
    duplicate: item.duplicate,
    validationErrors: item.validationErrors,
    qualityWarnings: item.qualityWarnings,
  });

  return (
    <div className="skills-import-skill-row" aria-label={rowState.ariaLabel}>
      <div className="skills-import-skill-header">
        <div className="skills-import-skill-title" title={item.displayName}>
          {item.displayName}
          <span className="skills-import-skill-issue-summary">
            {rowState.issueSummary}
          </span>
        </div>
        <span
          className={`skills-import-chip ${importChipClass(
            rowState.statusTone,
          )}`}
        >
          {rowState.statusLabel}
        </span>
      </div>
      {rowState.visibleIssues.map((issue) => (
        <div
          key={issue.key}
          className={
            issue.tone === "error"
              ? "skills-import-message-error"
              : "skills-import-message-warn"
          }
        >
          {issue.message}
        </div>
      ))}
      {rowState.hiddenIssueMessage && (
        <div className="skills-import-message-muted">
          {rowState.hiddenIssueMessage}
        </div>
      )}
    </div>
  );
}
