export type SettingsRefreshTask =
  | "settings"
  | "index"
  | "claude"
  | "doctor"
  | "runtime"
  | "chat"
  | "quality"
  | "release";

export type SettingsRefreshPlan =
  | "initial"
  | "after-claude-login"
  | "after-cli-test-success"
  | "after-cli-test-failure"
  | "after-settings-save"
  | "manual-refresh"
  | "after-index-rebuild"
  | "claude-panel-refresh";

export type SettingsRefreshActions = Partial<
  Record<SettingsRefreshTask, () => void>
>;

const SETTINGS_REFRESH_TASKS: Record<
  SettingsRefreshPlan,
  readonly SettingsRefreshTask[]
> = {
  initial: [
    "settings",
    "index",
    "claude",
    "doctor",
    "runtime",
    "chat",
    "quality",
    "release",
  ],
  "after-claude-login": ["claude", "doctor", "chat", "release"],
  "after-cli-test-success": ["doctor", "claude", "chat", "release"],
  "after-cli-test-failure": ["doctor", "chat", "release"],
  "after-settings-save": ["doctor", "claude", "runtime", "chat", "release"],
  "manual-refresh": [
    "doctor",
    "claude",
    "runtime",
    "index",
    "chat",
    "quality",
    "release",
  ],
  "after-index-rebuild": ["doctor", "chat", "release"],
  "claude-panel-refresh": ["claude", "runtime"],
};

export function getSettingsRefreshTasks(
  plan: SettingsRefreshPlan,
): readonly SettingsRefreshTask[] {
  return SETTINGS_REFRESH_TASKS[plan];
}

export function runSettingsRefreshPlan(
  plan: SettingsRefreshPlan,
  actions: SettingsRefreshActions,
): void {
  for (const task of getSettingsRefreshTasks(plan)) {
    actions[task]?.();
  }
}
