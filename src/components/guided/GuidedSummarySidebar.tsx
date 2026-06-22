import {
  guidedChecklistStatusColor,
  type GuidedChecklistState,
} from "@/lib/ui/guided-checklist";

export interface GuidedSummaryMetric {
  label: string;
  value: number;
}

interface GuidedSummarySidebarProps {
  purpose: string;
  templateLabel: string | null;
  feedbackScore: number | null;
  metrics: GuidedSummaryMetric[];
  checklist: GuidedChecklistState;
  stepLabels: readonly string[];
  onSelectStep: (stepIndex: number) => void;
}

export function GuidedSummarySidebar({
  purpose,
  templateLabel,
  feedbackScore,
  metrics,
  checklist,
  stepLabels,
  onSelectStep,
}: GuidedSummarySidebarProps) {
  return (
    <aside className="guided-builder-side" aria-label="Guided skill summary">
      <div className="guided-summary-section guided-summary-head">
        <div
          className="guided-summary-label"
          style={{ color: "var(--text-muted)" }}
        >
          Draft Summary
        </div>
        <div className="guided-summary-title">
          {purpose.trim() || "Untitled guided skill"}
        </div>
        <div
          className="guided-summary-template"
          style={{ color: "var(--text-muted)" }}
        >
          {templateLabel ?? "Template loading"}
        </div>
        {feedbackScore !== null && (
          <div
            className="guided-summary-score"
            style={{
              color: feedbackScore >= 80 ? "var(--green)" : "var(--yellow)",
            }}
          >
            Rubric score {feedbackScore}/100
          </div>
        )}
      </div>
      <div className="guided-summary-metrics">
        {metrics.map(({ label, value }) => (
          <div
            key={label}
            className="guided-metric-card"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <div className="guided-metric-value">{value}</div>
            <div
              className="guided-metric-label"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
      <div
        className="guided-summary-section guided-checklist-section"
        aria-label="Guided skill readiness checklist"
      >
        <div className="guided-checklist-header">
          <div>
            <div
              className="guided-summary-label"
              style={{ color: "var(--text-muted)" }}
            >
              Review Readiness
            </div>
            <div className="guided-checklist-title">
              {checklist.readinessSummary}
            </div>
          </div>
          <div
            className="guided-checklist-count"
            style={{
              color: checklist.requiredReady ? "var(--green)" : "var(--yellow)",
            }}
          >
            {checklist.completedRequiredCount}/{checklist.requiredItems.length}
          </div>
        </div>
        <div className="guided-checklist-list">
          {checklist.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStep(item.stepIndex)}
              className="guided-checklist-item"
              aria-label={`Go to ${stepLabels[item.stepIndex]}: ${item.label}`}
            >
              <span
                className="ui-status-dot"
                style={{ background: guidedChecklistStatusColor(item.status) }}
              />
              <span className="guided-checklist-copy">
                <span className="guided-checklist-line">
                  <span>{item.label}</span>
                  <span className="guided-checklist-status">
                    {item.statusLabel}
                  </span>
                </span>
                <span className="guided-checklist-message">
                  {item.message}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
