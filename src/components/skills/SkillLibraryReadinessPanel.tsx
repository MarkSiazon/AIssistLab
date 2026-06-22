import Link from "next/link";
import type {
  SkillLibraryIndexState,
  SkillLibraryQualityIssue,
  SkillLibraryReadiness,
} from "@/lib/skills/library-readiness";
import {
  skillLibraryReadinessActionHref,
  skillLibraryStatusColor,
  type SkillQualitySummary,
} from "@/lib/ui/skills-library-readiness-panel";

interface SkillLibraryReadinessPanelProps {
  readiness: SkillLibraryReadiness;
  qualitySummary: SkillQualitySummary;
  topQualityIssues: SkillLibraryQualityIssue[];
  indexStatus?: SkillLibraryIndexState | null;
  indexRebuilding: boolean;
  onRefresh: () => void;
  onRebuildIndex: () => void;
}

export function SkillLibraryReadinessPanel({
  readiness,
  qualitySummary,
  topQualityIssues,
  indexStatus,
  indexRebuilding,
  onRefresh,
  onRebuildIndex,
}: SkillLibraryReadinessPanelProps) {
  const actionHref = skillLibraryReadinessActionHref(readiness.action);

  return (
    <section
      className="skills-readiness-panel"
      aria-labelledby="skills-library-readiness-title"
    >
      <div className="skills-readiness-header">
        <div className="skills-readiness-copy">
          <h2
            id="skills-library-readiness-title"
            className="skills-section-kicker"
          >
            Library Readiness
          </h2>
          <div className="skills-readiness-status">
            <span
              className="skills-readiness-dot"
              style={{
                background: skillLibraryStatusColor(readiness.status),
              }}
            />
            <span>{readiness.statusLabel}</span>
          </div>
        </div>
        {readiness.action === "refresh" ? (
          <button
            type="button"
            onClick={onRefresh}
            className="ui-button ui-button-secondary skills-readiness-action text-xs"
          >
            {readiness.actionLabel}
          </button>
        ) : readiness.action === "rebuild-index" ? (
          <button
            type="button"
            onClick={onRebuildIndex}
            disabled={indexRebuilding || indexStatus?.status === "rebuilding"}
            className="ui-button ui-button-secondary skills-readiness-action text-xs"
          >
            {indexRebuilding ? "Rebuilding..." : readiness.actionLabel}
          </button>
        ) : actionHref ? (
          <Link
            href={actionHref}
            className="ui-button ui-button-secondary skills-readiness-action text-xs"
          >
            {readiness.actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="skills-readiness-message">{readiness.message}</div>
      <div className="skills-quality-summary">
        <div className="skills-quality-summary-header">
          <div className="skills-quality-summary-title">
            <span
              className="skills-readiness-dot"
              style={{
                background: skillLibraryStatusColor(qualitySummary.status),
              }}
            />
            <span>Skill Quality</span>
          </div>
          <span className="skills-quality-summary-status">
            {qualitySummary.label}
          </span>
        </div>
        <div className="skills-quality-summary-message">
          {qualitySummary.message}
        </div>
      </div>
      <div className="skills-readiness-stats">
        <div className="skills-readiness-stat">
          <div className="skills-readiness-stat-value">
            {readiness.indexedSkillCount}
          </div>
          <div className="skills-readiness-stat-label">Indexed</div>
        </div>
        <div className="skills-readiness-stat">
          <div className="skills-readiness-stat-value">
            {readiness.chunkCount}
          </div>
          <div className="skills-readiness-stat-label">Chunks</div>
        </div>
        <div className="skills-readiness-stat">
          <div className="skills-readiness-stat-value">
            {readiness.issueCount}
          </div>
          <div className="skills-readiness-stat-label">Issues</div>
        </div>
      </div>
      {topQualityIssues.length > 0 && (
        <div className="skills-quality-issues">
          {topQualityIssues.map((issue) => (
            <div
              key={`${issue.skillName}-${issue.category}-${issue.message}`}
              className="skills-quality-issue"
            >
              <span
                className="font-medium"
                style={{
                  color:
                    issue.severity === "error" ? "var(--red)" : "var(--yellow)",
                }}
              >
                {issue.skillName}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                {`: ${issue.message}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
