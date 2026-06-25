import {
  scoreSections,
  summarizeStatus,
} from "@/lib/release/readiness-rules";
import { buildReleaseReadinessSections } from "@/lib/release/readiness-sections";
import type {
  ReleaseReadinessInput,
  ReleaseReadinessResponse,
} from "@/lib/release/readiness-types";

export type {
  ReleaseReadinessInput,
  ReleaseReadinessResponse,
} from "@/lib/release/readiness-types";

export function buildReleaseReadinessReport({
  generatedAt,
  doctor,
  chat,
  index,
  skillQuality,
  claudeProject,
}: ReleaseReadinessInput): ReleaseReadinessResponse {
  const sections = buildReleaseReadinessSections({
    doctor,
    chat,
    index,
    skillQuality,
    claudeProject,
  });
  const summaryStatus = summarizeStatus(sections);
  const topSection = sections.find(
    (item) => item.id !== "diagnostics" && item.status !== "ready",
  );

  return {
    schemaVersion: 1,
    generatedAt: generatedAt ?? new Date().toISOString(),
    summary: {
      status: summaryStatus,
      score: scoreSections(sections, doctor.summary.readinessScore),
      topAction: topSection?.message ?? null,
      canChat: chat.canSend,
      canExportDiagnostics: true,
    },
    sections,
  };
}
