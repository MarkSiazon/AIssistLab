import {
  selectReleasePrimaryAction,
  type ReleaseActionSection,
} from "./release-readiness-actions";
import type {
  ReleaseReadinessResponse,
  ReleaseReadinessSection,
  ReleaseReadinessStatus,
} from "@/lib/release/readiness-types";

type SettingsReleaseReadinessStatus = ReleaseReadinessStatus;
type SettingsReleaseReadinessSectionId = ReleaseReadinessSection["id"];

export interface SettingsReleaseReadinessSection extends ReleaseActionSection {
  id: SettingsReleaseReadinessSectionId;
  label: string;
  status: SettingsReleaseReadinessStatus;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export type SettingsReleaseReadinessReport = ReleaseReadinessResponse;

interface SettingsReleaseReadinessSnapshotItem {
  id: string;
  label: string;
  status: SettingsReleaseReadinessStatus;
  actionLabel?: string;
  actionHref?: string;
}

export interface SettingsReleaseReadinessPanelState {
  readyCount: number;
  sectionCount: number;
  snapshotItems: SettingsReleaseReadinessSnapshotItem[];
  snapshotCount: {
    blocked: number;
    needsAction: number;
  };
  primaryAction: SettingsReleaseReadinessSection | undefined;
}

function statusSortScore(status: SettingsReleaseReadinessStatus): number {
  if (status === "blocked") return 0;
  if (status === "needs_action") return 1;
  return 2;
}

export function getSettingsReleaseReadinessPanelState(
  report: SettingsReleaseReadinessReport | null,
): SettingsReleaseReadinessPanelState {
  if (!report) {
    return {
      readyCount: 0,
      sectionCount: 0,
      snapshotItems: [],
      snapshotCount: {
        blocked: 0,
        needsAction: 0,
      },
      primaryAction: undefined,
    };
  }

  const snapshotItems = report.sections
    .filter((section) => section.id !== "diagnostics")
    .map((section) => ({
      id: section.id,
      label: section.label,
      status: section.status,
      actionHref: section.actionHref,
      actionLabel: section.actionLabel,
    }))
    .sort(
      (a, b) => statusSortScore(a.status) - statusSortScore(b.status),
    );

  return {
    readyCount: report.sections.filter((section) => section.status === "ready")
      .length,
    sectionCount: report.sections.length,
    snapshotItems,
    snapshotCount: {
      blocked: snapshotItems.filter((item) => item.status === "blocked").length,
      needsAction: snapshotItems.filter((item) => item.status === "needs_action")
        .length,
    },
    primaryAction: selectReleasePrimaryAction(report.sections),
  };
}
