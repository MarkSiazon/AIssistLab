import {
  getSettingsClaudePanelState,
  type SettingsClaudeCliStatus,
  type SettingsClaudeProfileSummary,
  type SettingsClaudeRuntimeStatus,
  type SettingsClaudeTestResult,
} from "@/lib/ui/settings-claude-panel";

interface ClaudeCliPanelProps {
  claudeStatus: SettingsClaudeCliStatus | null;
  activeRuntime: SettingsClaudeRuntimeStatus | null;
  claudeTestResult: SettingsClaudeTestResult | null;
  testIsCurrent: boolean;
  claudeStatusLoading: boolean;
  claudeActionLoading: boolean;
  claudeTestLoading: boolean;
  profileActionDisabled: boolean;
  formatPath: (value: string) => string;
  profileStatusText: (profile: SettingsClaudeProfileSummary) => string;
  onRefresh: () => void;
  onOpenLogin: () => void;
  onTestCli: () => void;
}

export function ClaudeCliPanel({
  claudeStatus,
  activeRuntime,
  claudeTestResult,
  testIsCurrent,
  claudeStatusLoading,
  claudeActionLoading,
  claudeTestLoading,
  profileActionDisabled,
  formatPath,
  profileStatusText,
  onRefresh,
  onOpenLogin,
  onTestCli,
}: ClaudeCliPanelProps) {
  const panelState = claudeStatus
    ? getSettingsClaudePanelState({
        claudeStatus,
        activeRuntime,
        claudeTestResult,
        testIsCurrent,
        formatPath,
        profileStatusText,
      })
    : null;

  return (
    <section
      className="settings-claude-panel"
      aria-labelledby="settings-claude-title"
    >
      <div className="settings-claude-header">
        <div className="min-w-0">
          <h2 id="settings-claude-title" className="settings-claude-title">
            Claude CLI
          </h2>
          <div className="settings-claude-subtitle">
            Local install, profile auth, and smoke-test state
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={claudeStatusLoading}
          className="ui-button ui-button-secondary settings-claude-refresh text-xs"
        >
          {claudeStatusLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {claudeStatus && panelState ? (
        <div className="settings-claude-content">
          <div className="settings-claude-status-grid">
            {panelState.statusCards.map((card) => (
              <div
                key={card.label}
                className={`settings-claude-status-card settings-claude-status-card-${card.tone}`}
              >
                <div className="settings-claude-status-label">
                  {card.label}
                </div>
                <div className="settings-claude-status-value">
                  <span
                    className="settings-claude-status-dot"
                    aria-hidden="true"
                  />
                  {card.value}
                </div>
                <div className="settings-claude-status-detail">
                  {card.detail}
                </div>
              </div>
            ))}
          </div>

          <div className="settings-claude-detail-list">
            {panelState.detailRows.map((row) => (
              <div key={row.label} className="settings-claude-detail-row">
                <div className="settings-claude-detail-label">{row.label}</div>
                <div className="settings-claude-detail-value" title={row.value}>
                  {row.value}
                </div>
                <div className="settings-claude-detail-meta" title={row.meta}>
                  {row.meta}
                </div>
              </div>
            ))}
          </div>

          {claudeStatus.auth.error && (
            <div className="settings-claude-alert" role="status">
              {claudeStatus.auth.error}
            </div>
          )}
          {claudeTestResult && (
            <div
              className={`settings-claude-alert settings-claude-alert-${panelState.test.tone}`}
              role="status"
            >
              {panelState.test.alertText ?? `Test: ${panelState.test.label}`}
            </div>
          )}

          <div className="settings-claude-actions">
            <button
              type="button"
              onClick={onOpenLogin}
              disabled={
                claudeActionLoading ||
                !claudeStatus.canOpenLogin ||
                profileActionDisabled
              }
              className="ui-button ui-button-secondary settings-claude-action text-xs"
            >
              {claudeActionLoading ? "Opening..." : "Open Login"}
            </button>
            <button
              type="button"
              onClick={onTestCli}
              disabled={
                claudeTestLoading || !claudeStatus.installed || profileActionDisabled
              }
              className="ui-button ui-button-secondary settings-claude-action text-xs"
            >
              {claudeTestLoading ? "Testing..." : "Test CLI"}
            </button>
          </div>
        </div>
      ) : (
        <div className="settings-claude-loading" role="status">
          Loading...
        </div>
      )}
    </section>
  );
}
