import { countLabel } from "@/lib/format/count-label";
import type { RagIndexStateStatus } from "@/lib/rag/index-state-types";

export type FirstRunChecklistStatus = "ready" | "needs_action" | "optional";
export type FirstRunChecklistAction =
  | "save-settings"
  | "rebuild-index"
  | "test-cli"
  | "open-chat"
  | "export-diagnostics";

export interface FirstRunDoctorCheck {
  id: string;
  group: string;
  status: "ok" | "warn" | "error";
  message: string;
  suggestedFix?: string;
}

interface FirstRunIndexState {
  status: RagIndexStateStatus;
  skillCount: number;
  staleReason?: string | null;
  error?: string | null;
}

interface FirstRunRuntimeStatus {
  provider: "anthropic_api" | "claude_code_cli";
  source: "runtime" | "process";
}

export interface FirstRunChatStatus {
  canSend: boolean;
  blockingReason: string | null;
  suggestedAction: string | null;
}

export interface FirstRunChecklistInput {
  doctorChecks: FirstRunDoctorCheck[];
  indexStatus: FirstRunIndexState | null;
  runtimeStatus: FirstRunRuntimeStatus | null;
  chatStatus: FirstRunChatStatus | null;
  diagnosticsExported: boolean;
}

export interface FirstRunChecklistItem {
  id:
    | "workspace"
    | "skills"
    | "index"
    | "provider"
    | "auth"
    | "chat"
    | "diagnostics";
  label: string;
  status: FirstRunChecklistStatus;
  statusLabel: "Ready" | "Needs action" | "Optional";
  hint: string;
  action?: FirstRunChecklistAction;
  actionLabel?: string;
}

function findCheck(
  checks: FirstRunDoctorCheck[],
  id: string,
): FirstRunDoctorCheck | undefined {
  return checks.find((check) => check.id === id);
}

function checkIsOk(check: FirstRunDoctorCheck | undefined): boolean {
  return check?.status === "ok";
}

function groupHasNoErrors(
  checks: FirstRunDoctorCheck[],
  group: string,
): boolean {
  const groupChecks = checks.filter((check) => check.group === group);
  return groupChecks.length > 0 && groupChecks.every((check) => check.status !== "error");
}

function statusLabel(status: FirstRunChecklistStatus): "Ready" | "Needs action" | "Optional" {
  if (status === "ready") return "Ready";
  if (status === "optional") return "Optional";
  return "Needs action";
}

function item(
  input: Omit<FirstRunChecklistItem, "statusLabel">,
): FirstRunChecklistItem {
  return { ...input, statusLabel: statusLabel(input.status) };
}

export function buildFirstRunChecklist(
  input: FirstRunChecklistInput,
): FirstRunChecklistItem[] {
  const workspaceCheck = findCheck(input.doctorChecks, "workspace-root");
  const skillsCheck = findCheck(input.doctorChecks, "skills-dir");
  const apiAuthCheck = findCheck(input.doctorChecks, "anthropic-api-key");
  const cliSmokeCheck = findCheck(input.doctorChecks, "claude-cli-e2e");

  const provider =
    input.runtimeStatus?.provider === "claude_code_cli"
      ? "claude_code_cli"
      : "anthropic_api";
  const indexReady =
    input.indexStatus?.status === "ready" && input.indexStatus.skillCount > 0;
  const providerReady =
    Boolean(input.runtimeStatus) &&
    groupHasNoErrors(input.doctorChecks, "provider");
  const authReady =
    provider === "claude_code_cli"
      ? checkIsOk(cliSmokeCheck)
      : checkIsOk(apiAuthCheck);
  const diagnosticsActionLabel = input.diagnosticsExported
    ? "Open Export"
    : "Export";

  return [
    item({
      id: "workspace",
      label: "Workspace path valid",
      status: checkIsOk(workspaceCheck) ? "ready" : "needs_action",
      hint:
        workspaceCheck?.suggestedFix ??
        workspaceCheck?.message ??
        "Set WORKSPACE_ROOT to an accessible folder.",
      action: "save-settings",
      actionLabel: "Save",
    }),
    item({
      id: "skills",
      label: "Skills directory valid",
      status: checkIsOk(skillsCheck) ? "ready" : "needs_action",
      hint:
        skillsCheck?.suggestedFix ??
        skillsCheck?.message ??
        "Set SKILLS_DIR to the folder containing skill markdown files.",
      action: "save-settings",
      actionLabel: "Save",
    }),
    item({
      id: "index",
      label: "Index rebuilt",
      status: indexReady ? "ready" : "needs_action",
      hint: indexReady
        ? `${countLabel(input.indexStatus?.skillCount ?? 0, "skill")} indexed.`
        : input.indexStatus?.error ??
          input.indexStatus?.staleReason ??
          "Rebuild the index after workspace and skill paths are valid.",
      action: "rebuild-index",
      actionLabel: "Rebuild",
    }),
    item({
      id: "provider",
      label: "Provider selected",
      status: providerReady ? "ready" : "needs_action",
      hint: input.runtimeStatus
        ? `Active provider: ${input.runtimeStatus.provider} (${input.runtimeStatus.source}).`
        : "Choose and save an LLM provider.",
      action: "save-settings",
      actionLabel: "Save",
    }),
    item({
      id: "auth",
      label: "Claude/API auth tested",
      status: authReady ? "ready" : "needs_action",
      hint:
        provider === "claude_code_cli"
          ? cliSmokeCheck?.suggestedFix ??
            cliSmokeCheck?.message ??
            "Run Test CLI for the selected Claude profile."
          : apiAuthCheck?.suggestedFix ??
            apiAuthCheck?.message ??
            "Add a valid Anthropic API key in Settings.",
      action: provider === "claude_code_cli" ? "test-cli" : "save-settings",
      actionLabel: provider === "claude_code_cli" ? "Test CLI" : "Save",
    }),
    item({
      id: "chat",
      label: "First chat readiness",
      status: input.chatStatus?.canSend ? "ready" : "needs_action",
      hint: input.chatStatus?.canSend
        ? "Chat can send with the active provider and current index state."
        : input.chatStatus?.blockingReason ??
          input.chatStatus?.suggestedAction ??
          "Open Chat after provider, auth, and index readiness are resolved.",
      action: "open-chat",
      actionLabel: "Open Chat",
    }),
    item({
      id: "diagnostics",
      label: "Diagnostics export",
      status: input.diagnosticsExported ? "ready" : "optional",
      hint: input.diagnosticsExported
        ? "Diagnostics export was opened in this session."
        : "Export a diagnostics bundle when you are ready to archive setup state.",
      action: "export-diagnostics",
      actionLabel: diagnosticsActionLabel,
    }),
  ];
}
