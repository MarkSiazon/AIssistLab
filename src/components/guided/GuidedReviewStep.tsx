import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  GuidedHandoffState,
} from "@/lib/ui/guided-handoff";
import { guidedHandoffActionClass } from "@/lib/ui/guided-handoff";
import {
  guidedFeedbackStatusColor,
  type GuidedDraft,
  type GuidedFeedback,
} from "@/lib/ui/guided-builder-model";

interface GuidedReviewStepProps {
  feedback: GuidedFeedback | null;
  draft: GuidedDraft | null;
  loading: boolean;
  handoffState: GuidedHandoffState;
  onReviewDraft: () => void;
  onBuildDraft: () => void;
  onOpenInEditor: () => void;
}

export function GuidedReviewStep({
  feedback,
  draft,
  loading,
  handoffState,
  onReviewDraft,
  onBuildDraft,
  onOpenInEditor,
}: GuidedReviewStepProps) {
  return (
    <div className="guided-step-content">
      <div
        id="guided-review-action-help"
        className={`guided-review-help guided-review-help-${handoffState.status}`}
        data-status={handoffState.status}
        role="status"
      >
        <span className="guided-review-help-label">
          {handoffState.statusLabel}
        </span>
        <span>{handoffState.message}</span>
      </div>
      <div className="guided-review-actions">
        <button
          type="button"
          onClick={onReviewDraft}
          disabled={handoffState.reviewDisabled}
          aria-describedby="guided-review-action-help"
          className={guidedHandoffActionClass("review", handoffState)}
        >
          {loading ? "Checking..." : "Review Draft"}
        </button>
        <button
          type="button"
          onClick={onBuildDraft}
          disabled={handoffState.buildDisabled}
          aria-describedby="guided-review-action-help"
          className={guidedHandoffActionClass("build", handoffState)}
        >
          {loading ? "Building..." : "Build Draft"}
        </button>
        <button
          type="button"
          onClick={onOpenInEditor}
          disabled={handoffState.openDisabled}
          aria-describedby="guided-review-action-help"
          className={guidedHandoffActionClass("open", handoffState)}
        >
          Open in Editor
        </button>
      </div>

      {feedback && (
        <section className="guided-feedback-list" aria-label="Rubric feedback">
          <div className="guided-feedback-title">
            Rubric score {feedback.score}/100
          </div>
          {feedback.categories.map((category) => (
            <div
              key={category.id}
              className="guided-feedback-card"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-2)",
              }}
            >
              <div className="guided-feedback-status">
                <span
                  className="ui-status-dot"
                  style={{
                    background: guidedFeedbackStatusColor(category.status),
                  }}
                />
                <span>{category.id}</span>
                <span className="guided-feedback-state">{category.status}</span>
              </div>
              <div className="guided-feedback-message">{category.message}</div>
              <div
                className="guided-feedback-fix"
                style={{ color: "var(--text-muted)" }}
              >
                {category.suggestedFix}
              </div>
            </div>
          ))}
        </section>
      )}

      {feedback?.suggestedTestPrompts.length ? (
        <section>
          <div
            className="guided-section-kicker"
            style={{ color: "var(--text-muted)" }}
          >
            Suggested test prompts
          </div>
          <div className="guided-prompt-list">
            {feedback.suggestedTestPrompts.map((prompt) => (
              <div
                key={prompt}
                className="guided-prompt-card"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                {prompt}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {draft && (
        <section>
          <div
            className="guided-section-kicker"
            style={{ color: "var(--text-muted)" }}
          >
            Draft preview
          </div>
          <div
            className="guided-draft-preview prose max-w-none"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.body}</ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  );
}
