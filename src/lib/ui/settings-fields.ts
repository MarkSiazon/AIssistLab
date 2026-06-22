import type { SettingsConfigSection } from "@/lib/ui/settings-config-fields-panel";
import type { SettingsConfigField } from "@/lib/ui/settings-active-values-panel";

export const CORE_FIELDS: SettingsConfigField[] = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    type: "password",
    placeholder: "Paste API key",
    hint: "Used when LLM_PROVIDER is anthropic_api.",
  },
  {
    key: "WORKSPACE_ROOT",
    label: "Workspace Root Path",
    type: "path",
    placeholder: "C:\\path\\to\\workspace",
    hint: "Absolute path to your Claude Code CLI workspace directory",
  },
  {
    key: "SKILLS_DIR",
    label: "Skills Directory",
    type: "relpath",
    placeholder: ".claude/skills",
    hint: "Path to skills folder - browse relative to WORKSPACE_ROOT, or type a relative path",
  },
  {
    key: "NEXT_PUBLIC_APP_TITLE",
    label: "App Title",
    type: "text",
    placeholder: "Skill Workshop RAG",
    hint: "Displayed in the browser tab and app header",
  },
];

export const CLAUDE_CLI_FIELDS: SettingsConfigField[] = [
  {
    key: "LLM_PROVIDER",
    label: "LLM Provider",
    type: "select",
    placeholder: "anthropic_api",
    defaultValue: "anthropic_api",
    hint: "Use anthropic_api for deployable API-key mode or claude_code_cli for local subscription mode.",
    options: [
      { value: "anthropic_api", label: "Anthropic API key" },
      { value: "claude_code_cli", label: "Local Claude CLI" },
    ],
  },
  {
    key: "ENABLE_LOCAL_CLAUDE_CLI",
    label: "Enable Local Claude CLI",
    type: "select",
    placeholder: "false",
    defaultValue: "false",
    hint: "Must be true before the app will call the local Claude CLI.",
    options: [
      { value: "false", label: "Disabled" },
      { value: "true", label: "Enabled" },
    ],
  },
  {
    key: "CLAUDE_CLI_PATH",
    label: "Claude CLI Command",
    type: "text",
    placeholder: "auto",
    defaultValue: "auto",
    hint: "Use auto to prefer the official native install path, then fall back to PATH. Set an explicit executable path only when needed.",
  },
  {
    key: "CLAUDE_LOGIN_COMMAND",
    label: "Claude Login Helper",
    type: "text",
    placeholder: "auto",
    defaultValue: "auto",
    hint: "Use auto to discover an optional claude-login helper, or fall back to Claude Code's built-in auth login.",
  },
  {
    key: "CLAUDE_CONFIG_DIR",
    label: "Claude Profile",
    type: "profile",
    placeholder: "Leave blank for the default Claude profile",
    hint: "Select a discovered local Claude profile, or use a manual portable path such as ~/.claude-profiles/<profile>.",
  },
];

export const CONFIG_SECTIONS: SettingsConfigSection[] = [
  { title: "Core Configuration", fields: CORE_FIELDS },
  { title: "Claude CLI", fields: CLAUDE_CLI_FIELDS },
];

export const KNOWN_FIELDS = [...CORE_FIELDS, ...CLAUDE_CLI_FIELDS];

export function getDefaultSettingsFieldValues(): Record<string, string> {
  return Object.fromEntries(
    KNOWN_FIELDS.filter((field) => field.defaultValue).map((field) => [
      field.key,
      field.defaultValue ?? "",
    ]),
  );
}
