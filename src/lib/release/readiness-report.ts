import {
  getClaudeProjectInventory,
  type ClaudeProjectInventory,
} from "@/lib/claude/project-inventory";
import { getCurrentChatStatus } from "@/lib/chat/status";
import type { PublicIndexState } from "@/lib/rag/index-state";
import { getIndexStatus } from "@/lib/store";
import {
  buildReleaseReadinessReport,
  type ReleaseReadinessResponse,
} from "@/lib/release/readiness";
import { getCurrentSetupDoctorReport } from "@/lib/settings/doctor-report";
import type { SetupDoctorReport } from "@/lib/settings/doctor";
import { buildSkillQualityReport, type SkillQualityReport } from "@/lib/skills/quality";
import { readAllSkills } from "@/lib/skills/reader";
import type { Skill } from "@/types/skill";

export interface CurrentReleaseReadinessOptions {
  generatedAt?: string;
  skills?: Skill[];
  workspaceRoot?: string;
}

export interface CurrentReleaseReadinessEvidence {
  readiness: ReleaseReadinessResponse;
  doctor: SetupDoctorReport;
  index: PublicIndexState;
  skillQuality: SkillQualityReport;
  claudeProject: ClaudeProjectInventory | null;
}

export async function getCurrentReleaseReadinessEvidence({
  generatedAt,
  skills,
  workspaceRoot,
}: CurrentReleaseReadinessOptions = {}): Promise<CurrentReleaseReadinessEvidence> {
  const [index, doctor, resolvedSkills] = await Promise.all([
    getIndexStatus(),
    getCurrentSetupDoctorReport(),
    skills ? Promise.resolve(skills) : readAllSkills(),
  ]);
  const chat = await getCurrentChatStatus({
    includeSuggestedQuestions: false,
    index,
  });
  const claudeProject =
    doctor.claudeProject ??
    (await getClaudeProjectInventory(
      workspaceRoot ?? process.env.WORKSPACE_ROOT ?? process.cwd(),
    ));
  const skillQuality = buildSkillQualityReport(resolvedSkills);
  const readiness = buildReleaseReadinessReport({
    generatedAt,
    doctor,
    chat,
    index,
    skillQuality,
    claudeProject,
  });

  return {
    readiness,
    doctor,
    index,
    skillQuality,
    claudeProject,
  };
}
