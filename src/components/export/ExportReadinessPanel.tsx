import Link from "next/link";
import { isSafeInternalActionHref } from "@/lib/ui/internal-action-href";
import {
  buildExportReadinessMetrics,
  buildExportReadinessStatus,
  diagnosticsContents,
  diagnosticsPrivacyCopy,
  readinessColor,
  readinessCopy,
  readinessLabel,
  type ReleaseReadinessResponse,
} from "@/lib/ui/export-page-model";

interface ExportReadinessPanelProps {
  readiness: ReleaseReadinessResponse | undefined;
  readinessError: unknown;
  onExportDiagnostics: () => void;
}

export function ExportReadinessPanel({
  readiness,
  readinessError,
  onExportDiagnostics,
}: ExportReadinessPanelProps) {
  const readinessSummary = readiness?.summary;
  const readinessSections = readiness?.sections ?? [];
  const readinessIsChecking = !readinessSummary && !readinessError;
  const readinessMetrics = buildExportReadinessMetrics(
    readinessSummary,
    Boolean(readinessError),
  );
  const status = buildExportReadinessStatus({
    readinessSummary,
    readinessError,
  });

  return (
    <section
      className="ui-panel export-readiness"
      aria-label="Diagnostics readiness"
      aria-busy={readinessIsChecking}
    >
      <div className="export-readiness-copy">
        <div className="export-section-label">Diagnostics readiness</div>
        <div
          className="export-readable-text"
          style={{ color: "var(--text-muted)" }}
        >
          {readinessCopy(readinessSummary, Boolean(readinessError))}
        </div>
        <div className="export-privacy-note" role="note">
          {diagnosticsPrivacyCopy}
        </div>
        {readinessSummary?.topAction && (
          <div
            className="export-top-action"
            style={{
              color:
                readinessSummary.status === "blocked"
                  ? "var(--red)"
                  : "var(--yellow)",
            }}
          >
            {readinessSummary.topAction}
          </div>
        )}
        <div className="export-readiness-metrics">
          {readinessMetrics.map((item) => (
            <div
              key={item.label}
              className={`export-readiness-metric ${
                readinessIsChecking ? "export-readiness-metric-checking" : ""
              }`}
            >
              <div className="export-readiness-metric-value">{item.value}</div>
              <div className="export-readiness-metric-label">{item.label}</div>
            </div>
          ))}
        </div>
        {readinessSections.length > 0 && (
          <div
            className="export-readiness-section-list"
            aria-label="Release readiness evidence"
          >
            {readinessSections.map((section) => (
              <div
                key={section.id}
                className="export-readiness-section"
                data-status={section.status}
              >
                <div className="export-readiness-section-header">
                  <div className="export-readiness-section-label">
                    <span
                      className="ui-status-dot"
                      style={{ background: readinessColor(section.status) }}
                    />
                    <span>{section.label}</span>
                  </div>
                  <span className="export-readiness-section-status">
                    {readinessLabel(section.status)}
                  </span>
                </div>
                <div className="export-readiness-section-message">
                  {section.message}
                </div>
                {isSafeInternalActionHref(section.actionHref) &&
                  section.actionLabel && (
                  <Link
                    href={section.actionHref}
                    className="export-readiness-section-action"
                  >
                    {section.actionLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
        <div
          className="export-diagnostics-contents"
          aria-label="Diagnostics bundle contents"
        >
          <div className="export-diagnostics-contents-header">
            <span>Diagnostics bundle includes</span>
            <span>Local-only</span>
          </div>
          <div className="export-diagnostics-contents-list">
            {diagnosticsContents.map((item) => (
              <span key={item} className="export-diagnostics-content-pill">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="export-readiness-actions">
          <Link href="/settings" className="ui-button ui-button-secondary text-xs">
            Open Settings
          </Link>
          <button
            type="button"
            onClick={onExportDiagnostics}
            className="ui-button ui-button-secondary text-xs"
            aria-label="Download diagnostics bundle with sanitized local readiness data"
          >
            Export Diagnostics
          </button>
        </div>
      </div>
      <div className="export-readiness-status">
        <div className="ui-status-pill">
          <span
            className="ui-status-dot"
            style={{ background: status.statusColor }}
          />
          {status.statusLabel}
        </div>
        <div className="export-score">{status.scoreLabel}</div>
      </div>
    </section>
  );
}
