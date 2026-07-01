import type {
  FirstRunChecklistAction,
  FirstRunChecklistItem,
} from "@/lib/settings/first-run-checklist";
import {
  firstRunStatusClass,
  firstRunStatusColor,
} from "@/lib/ui/settings-status";
import {
  firstRunActionHelpId,
  firstRunNextStepLabel,
  firstRunNextStepText,
  getFirstRunChecklistSummary,
  shouldShowFirstRunAction,
} from "@/lib/ui/first-run-checklist-panel";

interface FirstRunChecklistPanelProps {
  items: FirstRunChecklistItem[];
  isActionDisabled: (action: FirstRunChecklistAction) => boolean;
  getActionHint: (action: FirstRunChecklistAction) => string | null;
  onAction: (action: FirstRunChecklistAction) => void;
}

export function FirstRunChecklistPanel({
  items,
  isActionDisabled,
  getActionHint,
  onAction,
}: FirstRunChecklistPanelProps) {
  const summary = getFirstRunChecklistSummary(items);

  return (
    <div
      className="settings-first-run-panel"
      style={{ borderColor: "var(--border)" }}
      aria-labelledby="settings-first-run-title"
    >
      <div className="settings-first-run-header">
        <div className="min-w-0">
          <h2 id="settings-first-run-title" className="settings-first-run-title">
            First Run Checklist
          </h2>
          <div className="settings-first-run-subtitle">
            {summary.readyCount} of {summary.totalCount} complete
            {summary.needsActionCount > 0
              ? `, ${summary.needsActionCount} need action`
              : ""}
          </div>
        </div>
        <div
          className="settings-first-run-progress"
          aria-label={`${summary.readyCount} of ${summary.totalCount} first run steps complete`}
        >
          {summary.readyCount}/{summary.totalCount}
        </div>
      </div>
      {summary.nextItem && (
        <div className="settings-first-run-next" role="status">
          <span>{firstRunNextStepLabel(summary.nextItem.status)}</span>
          <strong>{firstRunNextStepText(summary.nextItem)}</strong>
        </div>
      )}
      <div className="settings-first-run-list" role="list">
        {items.map((item, index) => {
          const action = item.action;
          const showAction = Boolean(action && shouldShowFirstRunAction(item));
          const actionDisabled = action ? isActionDisabled(action) : false;
          const disabledHint =
            action && actionDisabled ? getActionHint(action) : null;
          const actionHelpId = firstRunActionHelpId({
            itemId: item.id,
            actionDisabled,
            disabledHint,
          });

          return (
            <div
              key={item.id}
              className={`settings-first-run-item ${firstRunStatusClass(
                item.status,
              )}`}
              role="listitem"
            >
              <div className="settings-first-run-item-index">{index + 1}</div>
              <div className="settings-first-run-item-body">
                <div className="settings-first-run-item-line">
                  <div className="settings-first-run-item-label">
                    {item.label}
                  </div>
                  <div
                    className="settings-first-run-item-status"
                    style={{ color: firstRunStatusColor(item.status) }}
                  >
                    <span
                      className="settings-first-run-dot"
                      style={{
                        background: firstRunStatusColor(item.status),
                      }}
                      aria-hidden="true"
                    />
                    {item.statusLabel}
                  </div>
                </div>
                <div className="settings-first-run-item-hint">{item.hint}</div>
                {showAction && action && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAction(action)}
                      disabled={actionDisabled}
                      className="ui-button ui-button-secondary settings-first-run-action text-xs"
                      aria-describedby={actionHelpId}
                    >
                      {item.actionLabel}
                    </button>
                    {actionHelpId && disabledHint && (
                      <div
                        id={actionHelpId}
                        className="settings-first-run-item-hint settings-first-run-item-hint-note"
                      >
                        {disabledHint}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="settings-first-run-note">
        Complete these in order. The checklist reuses Setup Doctor, runtime
        provider status, index status, CLI smoke-test state, chat readiness, and
        diagnostics export.
      </div>
    </div>
  );
}
