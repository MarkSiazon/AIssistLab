import type { SetupDoctorCheck } from "@/lib/settings/doctor";
import {
  doctorSeverityLabel,
  doctorStatusColor,
} from "@/lib/ui/settings-status";

export interface SetupDoctorCheckCardState {
  background: string;
  statusColor: string;
  severityLabel: string;
  fix: string | null;
  envKeysLabel: string | null;
}

export function getSetupDoctorCheckCardState({
  check,
  showFix,
  showEnvKeys,
}: {
  check: SetupDoctorCheck;
  showFix: boolean;
  showEnvKeys: boolean;
}): SetupDoctorCheckCardState {
  return {
    background: check.status === "ok" ? "transparent" : "var(--surface-2)",
    statusColor: doctorStatusColor(check.status),
    severityLabel: doctorSeverityLabel(check.severity),
    fix: showFix && check.suggestedFix ? check.suggestedFix : null,
    envKeysLabel:
      showEnvKeys && check.relatedEnvKeys.length > 0
        ? check.relatedEnvKeys.join(", ")
        : null,
  };
}
