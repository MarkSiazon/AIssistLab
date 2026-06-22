import assert from "node:assert/strict";
import { buildReleaseReadinessReport } from "./readiness";
import type { SetupDoctorReport } from "@/lib/settings/doctor";
import type { PublicIndexState } from "@/lib/rag/index-state";
import type { SkillQualityReport } from "@/lib/skills/quality";
import type { ClaudeProjectInventory } from "@/lib/claude/project-inventory";

const baseDoctor: SetupDoctorReport = {
  summary: {
    status: "ok",
    readinessScore: 100,
    errorCount: 0,
    warningCount: 0,
    okCount: 3,
    topRecommendation: null,
  },
  checks: [
    {
      id: "workspace-root",
      group: "workspace",
      title: "Workspace root",
      status: "ok",
      severity: "optional",
      message: "Workspace is ready.",
      relatedEnvKeys: ["WORKSPACE_ROOT"],
    },
    {
      id: "skills-dir",
      group: "workspace",
      title: "Skills directory",
      status: "ok",
      severity: "optional",
      message: "Skills directory is ready.",
      relatedEnvKeys: ["SKILLS_DIR"],
    },
    {
      id: "anthropic-api-key",
      group: "provider",
      title: "Anthropic API key",
      status: "ok",
      severity: "optional",
      message: "Provider is ready.",
      relatedEnvKeys: ["ANTHROPIC_API_KEY"],
    },
  ],
  claudeProject: null,
};

const readyIndex: PublicIndexState = {
  status: "ready",
  built: true,
  builtAt: "2026-06-15T00:00:00.000Z",
  skillCount: 2,
  chunkCount: 8,
  staleReason: null,
  workspaceDisplay: "~\\workspace",
  skillsDirDisplay: "~\\workspace\\.claude\\skills",
  error: null,
};

const cleanQuality: SkillQualityReport = {
  totalSkills: 2,
  issueCount: 0,
  issues: [],
};

const cleanClaudeProject: ClaudeProjectInventory = {
  workspaceDisplay: "~\\workspace",
  counts: {
    skills: 2,
    commands: 0,
    agents: 0,
    mcpServers: 0,
    hooks: 0,
    pluginFolders: 0,
  },
  checks: [],
  reloadHints: [],
};

function byId(report: ReturnType<typeof buildReleaseReadinessReport>) {
  return Object.fromEntries(report.sections.map((section) => [section.id, section]));
}

async function main() {
  const ready = buildReleaseReadinessReport({
    generatedAt: "2026-06-15T00:00:00.000Z",
    doctor: baseDoctor,
    chat: {
      canSend: true,
      blockingReason: null,
      suggestedAction: null,
    },
    index: readyIndex,
    skillQuality: cleanQuality,
    claudeProject: cleanClaudeProject,
  });
  assert.equal(ready.schemaVersion, 1);
  assert.equal(ready.summary.status, "ready");
  assert.equal(ready.summary.canChat, true);
  assert.equal(ready.summary.canExportDiagnostics, true);
  assert.equal(byId(ready).diagnostics.status, "needs_action");
  assert.equal(byId(ready).diagnostics.actionHref, "/export?diagnostics=true");

  const blocked = buildReleaseReadinessReport({
    generatedAt: "2026-06-15T00:00:00.000Z",
    doctor: {
      ...baseDoctor,
      summary: {
        ...baseDoctor.summary,
        status: "error",
        readinessScore: 70,
        errorCount: 1,
        topRecommendation:
          "Set WORKSPACE_ROOT to C:\\Users\\Example\\private-workspace.",
      },
      checks: baseDoctor.checks.map((check) =>
        check.id === "workspace-root"
          ? {
              ...check,
              status: "error",
              severity: "blocking",
              message:
                "WORKSPACE_ROOT failed at C:\\Users\\Example\\private-workspace.",
              suggestedFix:
                "Set WORKSPACE_ROOT to C:\\Users\\Example\\private-workspace.",
            }
          : check,
      ),
    },
    chat: {
      canSend: false,
      blockingReason: "ANTHROPIC_API_KEY is not configured.",
      suggestedAction: "Add a valid ANTHROPIC_API_KEY in Settings.",
    },
    index: {
      ...readyIndex,
      status: "failed",
      error: "Failed reading C:\\Users\\Example\\.claude\\oauth-secret",
    },
    skillQuality: {
      totalSkills: 1,
      issueCount: 1,
      issues: [
        {
          skillName: "release-user@example.invalid",
          code: "missing_description",
          category: "discoverability",
          severity: "warn",
          message: "release-user@example.invalid is missing a useful description.",
        },
      ],
    },
    claudeProject: {
      ...cleanClaudeProject,
      workspaceDisplay: "C:\\Users\\Example\\workspace",
      checks: [
        {
          id: "claude-project-settings",
          status: "warn",
          title: "Project settings",
          message:
            "Settings reference C:\\Users\\Example\\.claude-profiles\\work-profile.",
        },
      ],
    },
  });
  const blockedRaw = JSON.stringify(blocked);
  assert.equal(blocked.summary.status, "blocked");
  assert.equal(blocked.summary.canChat, false);
  assert.equal(byId(blocked).workspace.status, "blocked");
  assert.equal(byId(blocked).chat.actionHref, "/settings");
  assert.doesNotMatch(blockedRaw, /C:\\Users\\/i);
  assert.doesNotMatch(blockedRaw, /release-user@example\.invalid/i);
  assert.doesNotMatch(blockedRaw, /oauth-secret/i);
  assert.doesNotMatch(blockedRaw, /\.claude-profiles\\work-profile/i);

  const stale = buildReleaseReadinessReport({
    generatedAt: "2026-06-15T00:00:00.000Z",
    doctor: baseDoctor,
    chat: {
      canSend: true,
      blockingReason: null,
      suggestedAction: "Rebuild Index to refresh citations.",
    },
    index: {
      ...readyIndex,
      status: "stale",
      staleReason: "Skill files changed.",
    },
    skillQuality: cleanQuality,
    claudeProject: cleanClaudeProject,
  });
  assert.equal(stale.summary.status, "needs_action");
  assert.equal(byId(stale).index.status, "needs_action");
  assert.equal(byId(stale).chat.status, "needs_action");

  console.log("Release readiness builder tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
