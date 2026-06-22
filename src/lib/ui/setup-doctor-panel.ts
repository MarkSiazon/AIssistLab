import type {
  DoctorCheckGroup,
  DoctorCheckStatus,
  SetupDoctorCheck,
  SetupDoctorReport,
} from "@/lib/settings/doctor";

export interface SetupDoctorPanelGroup {
  id: DoctorCheckGroup;
  label: string;
  checks: SetupDoctorCheck[];
}

export interface SetupDoctorPanelState {
  status: DoctorCheckStatus;
  statusLabel: string;
  scoreLabel: string;
  countsLabel: string;
  topRecommendation: string | null;
  topActions: SetupDoctorCheck[];
  groups: SetupDoctorPanelGroup[];
}

function doctorSummaryStatusLabel(status: DoctorCheckStatus): string {
  if (status === "ok") return "Ready";
  if (status === "warn") return "Needs attention";
  return "Blocked";
}

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function getSetupDoctorPanelState({
  report,
  groupLabels,
}: {
  report: SetupDoctorReport;
  groupLabels: Record<DoctorCheckGroup, string>;
}): SetupDoctorPanelState {
  return {
    status: report.summary.status,
    statusLabel: doctorSummaryStatusLabel(report.summary.status),
    scoreLabel: `Readiness score ${report.summary.readinessScore}/100`,
    countsLabel: `${pluralize(report.summary.errorCount, "error")}, ${pluralize(
      report.summary.warningCount,
      "warning",
    )}`,
    topRecommendation: report.summary.topRecommendation,
    topActions: report.checks.filter((item) => item.status !== "ok").slice(0, 3),
    groups: (Object.keys(groupLabels) as DoctorCheckGroup[])
      .map((group) => ({
        id: group,
        label: groupLabels[group],
        checks: report.checks.filter((item) => item.group === group),
      }))
      .filter((group) => group.checks.length > 0),
  };
}
