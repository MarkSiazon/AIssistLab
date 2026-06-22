import {
  chatStatus,
  claudeProjectStatus,
  firstProblemMessage,
  groupChecks,
  indexStatus,
  skillsStatus,
  statusFromChecks,
} from "@/lib/release/readiness-rules";
import { sanitizeReleaseSection } from "@/lib/release/readiness-sanitize";
import type {
  ReleaseReadinessInput,
  ReleaseReadinessSection,
} from "@/lib/release/readiness-types";

type ReleaseReadinessSectionInput = Omit<
  ReleaseReadinessInput,
  "generatedAt"
>;

function plural(value: number, singular: string, pluralLabel: string): string {
  return `${value} ${value === 1 ? singular : pluralLabel}`;
}

function claudeProjectWarningCount(
  input: ReleaseReadinessSectionInput["claudeProject"],
): number {
  return input?.checks.filter((check) => check.status !== "ok").length ?? 0;
}

export function buildReleaseReadinessSections({
  doctor,
  chat,
  index,
  skillQuality,
  claudeProject,
}: ReleaseReadinessSectionInput): ReleaseReadinessSection[] {
  const workspaceChecks = groupChecks(doctor.checks, ["workspace"]);
  const providerChecks = groupChecks(doctor.checks, ["provider", "cli", "login"]);
  const workspaceState = statusFromChecks(workspaceChecks);
  const providerState = chat.canSend
    ? statusFromChecks(providerChecks)
    : "blocked";
  const indexState = indexStatus(index);
  const skillsState = skillsStatus(skillQuality);
  const claudeState = claudeProjectStatus(claudeProject);
  const chatState = chatStatus(chat);
  const claudeWarningCount = claudeProjectWarningCount(claudeProject);

  return [
    sanitizeReleaseSection({
      id: "workspace",
      label: "Workspace",
      status: workspaceState,
      message:
        workspaceState === "ready"
          ? "Workspace and skills paths are valid."
          : firstProblemMessage(
              workspaceChecks,
              "Resolve workspace and skills path issues in Settings.",
            ),
      actionLabel: workspaceState === "ready" ? undefined : "Open Settings",
      actionHref: workspaceState === "ready" ? undefined : "/settings",
    }),
    sanitizeReleaseSection({
      id: "provider",
      label: "Provider",
      status: providerState,
      message:
        providerState === "ready"
          ? "The active provider is configured for this session."
          : chat.blockingReason ??
            firstProblemMessage(
              providerChecks,
              "Resolve provider authentication in Settings.",
            ),
      actionLabel: providerState === "ready" ? undefined : "Open Settings",
      actionHref: providerState === "ready" ? undefined : "/settings",
    }),
    sanitizeReleaseSection({
      id: "index",
      label: "RAG Index",
      status: indexState,
      message:
        indexState === "ready"
          ? `${plural(index.skillCount, "skill", "skills")} indexed with ${plural(index.chunkCount, "chunk", "chunks")}.`
          : index.error ??
            index.staleReason ??
            "Rebuild the index before relying on citations.",
      actionLabel: indexState === "ready" ? undefined : "Rebuild Index",
      actionHref: indexState === "ready" ? undefined : "/settings",
    }),
    sanitizeReleaseSection({
      id: "skills",
      label: "Skill Quality",
      status: skillsState,
      message:
        skillsState === "ready"
          ? `${plural(skillQuality.totalSkills, "skill", "skills")} scanned with no quality issues.`
          : `${plural(skillQuality.issueCount, "skill quality issue", "skill quality issues")} should be reviewed before release.`,
      actionLabel: skillsState === "ready" ? undefined : "Open Settings",
      actionHref: skillsState === "ready" ? undefined : "/settings",
    }),
    sanitizeReleaseSection({
      id: "claude_project",
      label: "Claude Project",
      status: claudeState,
      message:
        claudeState === "ready"
          ? "Claude project inventory has no blocking warnings."
          : `${plural(claudeWarningCount, "Claude project warning", "Claude project warnings")} should be reviewed.`,
      actionLabel: claudeState === "ready" ? undefined : "Open Settings",
      actionHref: claudeState === "ready" ? undefined : "/settings",
    }),
    sanitizeReleaseSection({
      id: "chat",
      label: "Chat",
      status: chatState,
      message:
        chatState === "ready"
          ? "Chat can send with the active provider and current index state."
          : chat.blockingReason ??
            chat.suggestedAction ??
            "Resolve chat readiness before sending the first prompt.",
      actionLabel:
        chatState === "ready"
          ? "Open Chat"
          : chat.canSend
            ? "Open Chat"
            : "Open Settings",
      actionHref: chat.canSend ? "/chat" : "/settings",
    }),
    sanitizeReleaseSection({
      id: "diagnostics",
      label: "Diagnostics",
      status: "needs_action",
      message:
        "Export diagnostics when you are ready to share or archive release evidence.",
      actionLabel: "Open Export",
      actionHref: "/export?diagnostics=true",
    }),
  ];
}
