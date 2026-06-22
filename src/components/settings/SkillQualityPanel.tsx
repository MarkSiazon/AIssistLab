import type { SkillQualityReport } from "@/lib/skills/quality";
import { getSkillQualityPanelState } from "@/lib/ui/skill-quality-panel";

interface SkillQualityPanelProps {
  qualityReport: SkillQualityReport | null;
}

export function SkillQualityPanel({ qualityReport }: SkillQualityPanelProps) {
  return (
    <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
      <div
        className="text-xs font-medium mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        Skill Quality
      </div>
      {qualityReport ? (
        <SkillQualityPanelBody qualityReport={qualityReport} />
      ) : (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Quality report unavailable
        </div>
      )}
    </div>
  );
}

function SkillQualityPanelBody({
  qualityReport,
}: {
  qualityReport: SkillQualityReport;
}) {
  const state = getSkillQualityPanelState(qualityReport);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: state.statusColor }}
        />
        <span className="text-xs">{state.statusLabel}</span>
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {state.scannedLabel}
      </div>
      {state.issues.map((issue) => (
        <div
          key={issue.key}
          className="rounded border p-2"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
          }}
        >
          <div className="text-xs font-medium">{issue.skillName}</div>
          <div
            className="text-[10px] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            {issue.categoryLabel} / {issue.severity}
          </div>
          <div
            className="text-xs"
            style={{ color: "var(--text-muted)", lineHeight: 1.4 }}
          >
            {issue.message}
          </div>
        </div>
      ))}
    </div>
  );
}
