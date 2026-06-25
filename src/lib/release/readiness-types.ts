import type { ClaudeProjectInventory } from "@/lib/claude/project-inventory";
import type { ChatReadiness } from "@/lib/chat/readiness";
import type { PublicIndexState } from "@/lib/rag/index-state";
import type { SetupDoctorReport } from "@/lib/settings/doctor";
import type { SkillQualityReport } from "@/lib/skills/quality";
import type { BlockingReadinessStatus } from "@/lib/status/status-types";

export type ReleaseReadinessStatus = BlockingReadinessStatus;
type ReleaseReadinessSectionId =
  | "workspace"
  | "provider"
  | "index"
  | "skills"
  | "claude_project"
  | "chat"
  | "diagnostics";

export interface ReleaseReadinessSection {
  id: ReleaseReadinessSectionId;
  label: string;
  status: ReleaseReadinessStatus;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface ReleaseReadinessResponse {
  schemaVersion: 1;
  generatedAt: string;
  summary: {
    status: ReleaseReadinessStatus;
    score: number;
    topAction: string | null;
    canChat: boolean;
    canExportDiagnostics: boolean;
  };
  sections: ReleaseReadinessSection[];
}

export interface ReleaseReadinessInput {
  generatedAt?: string;
  doctor: SetupDoctorReport;
  chat: ChatReadiness;
  index: PublicIndexState;
  skillQuality: SkillQualityReport;
  claudeProject: ClaudeProjectInventory | null;
}
