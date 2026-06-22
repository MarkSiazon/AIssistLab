import Link from "next/link";
import {
  getSettingsReleaseActionPresentation,
  shouldShowReleaseSectionAction,
} from "@/lib/ui/release-readiness-actions";
import { isSafeInternalActionHref } from "@/lib/ui/internal-action-href";
import {
  getSettingsReleaseReadinessPanelState,
  type SettingsReleaseReadinessReport,
  type SettingsReleaseReadinessSection,
} from "@/lib/ui/settings-release-readiness-panel";
import {
  releaseStatusColor,
  releaseStatusLabel,
  releaseStatusTone,
} from "@/lib/ui/settings-status";

interface ReleaseReadinessPanelProps {
  report: SettingsReleaseReadinessReport | null;
  saving: boolean;
  indexRebuilding: boolean;
  isActionDisabled: (section: SettingsReleaseReadinessSection) => boolean;
  onAction: (section: SettingsReleaseReadinessSection) => void;
}

export function ReleaseReadinessPanel({
  report,
  saving,
  indexRebuilding,
  isActionDisabled,
  onAction,
}: ReleaseReadinessPanelProps) {
  const state = getSettingsReleaseReadinessPanelState(report);

  return (
    <>
      {report && state.snapshotItems.length > 0 ? (
        <div className="settings-readiness-strip">
          <div className="settings-readiness-strip-title">
            V1 Readiness Snapshot
          </div>
          <div className="settings-readiness-strip-summary">
            <span>{report.summary.score}/100</span>
            <span>{`Blocked: ${state.snapshotCount.blocked}`}</span>
            <span>{`Needs action: ${state.snapshotCount.needsAction}`}</span>
          </div>
          <div className="settings-readiness-strip-row">
            {state.snapshotItems.map((item) => {
              const tone = releaseStatusTone(item.status);
              return (
                <div key={item.id} className="settings-readiness-strip-item">
                  <span
                    className={`chat-status-chip chat-status-chip-${tone}`}
                    aria-label={`${item.label} ${releaseStatusLabel(item.status)}`}
                  >
                    <span className="chat-status-chip-dot" aria-hidden="true" />
                    {item.label}
                  </span>
                  <span
                    className="settings-readiness-strip-item-state"
                    style={{ color: releaseStatusColor(item.status) }}
                  >
                    {releaseStatusLabel(item.status)}
                  </span>
                  {isSafeInternalActionHref(item.actionHref) &&
                  item.actionLabel ? (
                    <Link
                      href={item.actionHref}
                      className="settings-readiness-strip-action-btn"
                      aria-label={`${item.actionLabel}: ${item.label}`}
                    >
                      {item.actionLabel}
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div
        className="settings-readiness-panel"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="settings-readiness-kicker">V1 Release Readiness</div>
        {report ? (
          <div className="flex flex-col gap-3">
            <div className="settings-readiness-hero">
              <div className="min-w-0">
                <div className="settings-readiness-status-line">
                  <span
                    className="settings-readiness-dot"
                    style={{
                      background: releaseStatusColor(report.summary.status),
                    }}
                  />
                  <span>{releaseStatusLabel(report.summary.status)}</span>
                </div>
                <div className="settings-readiness-count">
                  {state.readyCount} of {state.sectionCount} checks ready
                </div>
              </div>
              <div className="settings-readiness-score">
                <span>{report.summary.score}</span>
                <span>/100</span>
              </div>
            </div>
            <div
              className="settings-readiness-meter"
              aria-label={`Release readiness score ${report.summary.score} out of 100`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={report.summary.score}
              role="meter"
            >
              <span
                style={{
                  width: `${Math.max(0, Math.min(100, report.summary.score))}%`,
                  background: releaseStatusColor(report.summary.status),
                }}
              />
            </div>
            {report.summary.topAction && (
              <div className="settings-readiness-action-strip">
                <div className="settings-readiness-action-copy">
                  <span>Top action</span>
                  <strong>{report.summary.topAction}</strong>
                </div>
                {state.primaryAction &&
                  (() => {
                    const primaryAction = state.primaryAction;
                    const presentation = getSettingsReleaseActionPresentation({
                      section: primaryAction,
                      saving,
                      indexRebuilding,
                    });
                    return (
                      <button
                        type="button"
                        onClick={() => onAction(primaryAction)}
                        disabled={isActionDisabled(primaryAction)}
                        aria-label={presentation.ariaLabel}
                        className="ui-button ui-button-secondary settings-readiness-primary-action text-xs"
                      >
                        {presentation.label}
                      </button>
                    );
                  })()}
              </div>
            )}
            <div className="settings-readiness-section-list">
              {report.sections.map((section) => (
                <div
                  key={section.id}
                  className="settings-readiness-section"
                  style={{
                    borderColor: "var(--border)",
                    background:
                      section.status === "ready"
                        ? "transparent"
                        : "var(--surface-2)",
                  }}
                >
                  <div className="settings-readiness-section-header">
                    <div className="settings-readiness-section-label">
                      {section.label}
                    </div>
                    <div
                      className="settings-readiness-section-status"
                      style={{ color: releaseStatusColor(section.status) }}
                    >
                      {releaseStatusLabel(section.status)}
                    </div>
                  </div>
                  <div className="settings-readiness-section-message">
                    {section.message}
                  </div>
                  {shouldShowReleaseSectionAction({
                    section,
                    primaryAction: state.primaryAction,
                    topActionVisible: Boolean(report.summary.topAction),
                    currentPath: "/settings",
                  }) &&
                    (() => {
                      const presentation = getSettingsReleaseActionPresentation({
                        section,
                        saving,
                        indexRebuilding,
                      });
                      const disabled = isActionDisabled(section);
                      return (
                        <button
                          type="button"
                          onClick={() => onAction(section)}
                          disabled={disabled}
                          aria-label={presentation.ariaLabel}
                          className="settings-readiness-section-action"
                          style={{
                            borderColor: "var(--border)",
                            color: disabled ? "var(--text-muted)" : "var(--text)",
                            background: "transparent",
                            cursor: disabled ? "not-allowed" : "pointer",
                            minHeight: "44px",
                          }}
                        >
                          {presentation.label}
                        </button>
                      );
                    })()}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Release readiness unavailable
          </div>
        )}
      </div>
    </>
  );
}
