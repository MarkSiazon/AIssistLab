import type { SetupDoctorCheck } from "@/lib/settings/doctor";
import { getSetupDoctorCheckCardState } from "@/lib/ui/setup-doctor-check-card";

interface SetupDoctorCheckCardProps {
  check: SetupDoctorCheck;
  showFix?: boolean;
  showEnvKeys?: boolean;
}

export function SetupDoctorCheckCard({
  check,
  showFix = true,
  showEnvKeys = true,
}: SetupDoctorCheckCardProps) {
  const state = getSetupDoctorCheckCardState({
    check,
    showFix,
    showEnvKeys,
  });

  return (
    <div
      className="rounded border p-2"
      style={{
        borderColor: "var(--border)",
        background: state.background,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: state.statusColor }}
        />
        <span className="text-xs font-medium">{check.title}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded border"
          style={{
            borderColor: "var(--border)",
            color: state.statusColor,
          }}
        >
          {state.severityLabel}
        </span>
      </div>
      <div
        className="text-xs mt-1"
        style={{ color: "var(--text-muted)", lineHeight: 1.45 }}
      >
        {check.message}
      </div>
      {state.fix && (
        <div className="text-xs mt-1" style={{ color: "var(--yellow)" }}>
          {state.fix}
        </div>
      )}
      {state.envKeysLabel && (
        <div
          className="text-[10px] mt-1 font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {state.envKeysLabel}
        </div>
      )}
    </div>
  );
}
