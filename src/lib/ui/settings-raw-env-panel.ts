export const SETTINGS_RAW_ENV_PLACEHOLDER = [
  "ANTHROPIC_API_KEY=<redacted-api-key>",
  "WORKSPACE_ROOT=C:\\path\\to\\workspace",
  "SKILLS_DIR=.claude/skills",
  "NEXT_PUBLIC_APP_TITLE=Skill Workshop RAG",
  "LLM_PROVIDER=anthropic_api",
  "ENABLE_LOCAL_CLAUDE_CLI=false",
  "CLAUDE_CLI_PATH=auto",
  "CLAUDE_LOGIN_COMMAND=auto",
  "CLAUDE_CONFIG_DIR=",
].join("\n");

export interface SettingsRawEnvPanelModel {
  textareaId: string;
  helpId: string;
  label: string;
  helpText: string;
  placeholder: string;
}

export function getSettingsRawEnvPanelModel(): SettingsRawEnvPanelModel {
  return {
    textareaId: "settings-raw-env",
    helpId: "settings-raw-env-help",
    label: "Raw .env content",
    helpText:
      "Edit only local configuration values. Secrets remain local and are saved exactly as typed.",
    placeholder: SETTINGS_RAW_ENV_PLACEHOLDER,
  };
}
