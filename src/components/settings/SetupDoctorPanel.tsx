import type { ReactNode } from "react";
import type {
  DoctorCheckGroup,
  DoctorCheckStatus,
  SetupDoctorCheck,
  SetupDoctorReport,
} from "@/lib/settings/doctor";
import { getSetupDoctorPanelState } from "@/lib/ui/setup-doctor-panel";

interface SetupDoctorPanelProps {
  report: SetupDoctorReport | null;
  loading: boolean;
  groupLabels: Record<DoctorCheckGroup, string>;
  statusColor: (status: DoctorCheckStatus) => string;
  renderDoctorCheck: (
    item: SetupDoctorCheck,
    options?: { showFix?: boolean; showEnvKeys?: boolean },
  ) => ReactNode;
}

export function SetupDoctorPanel({
  report,
  loading,
  groupLabels,
  statusColor,
  renderDoctorCheck,
}: SetupDoctorPanelProps) {
  if (!report) {
    return (
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {loading ? "Loading..." : "Setup Doctor unavailable"}
      </div>
    );
  }

  const state = getSetupDoctorPanelState({ report, groupLabels });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: statusColor(state.status) }}
        />
        <div className="text-xs font-medium">{state.statusLabel}</div>
      </div>
      <div
        className="text-xs"
        style={{ color: "var(--text-muted)", lineHeight: 1.45 }}
      >
        {state.scoreLabel}
        <br />
        {state.countsLabel}
      </div>
      {state.topRecommendation && (
        <div className="text-xs" style={{ color: "var(--yellow)" }}>
          {state.topRecommendation}
        </div>
      )}

      {state.topActions.length > 0 && (
        <div className="flex flex-col gap-2">
          <div
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Top Actions
          </div>
          {state.topActions.map((item) => renderDoctorCheck(item))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {state.groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <div
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {group.label}
            </div>
            {group.checks.map((item) =>
              renderDoctorCheck(item, {
                showFix: false,
                showEnvKeys: item.status !== "ok",
              }),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
