import { useCallback, useEffect, useMemo } from "react";
import {
  runSettingsRefreshPlan,
  type SettingsRefreshActions,
} from "@/lib/ui/settings-refresh-plan";

interface SettingsRefreshCoordinatorInput {
  loadSettings: () => void;
  loadIndexStatus: () => void;
  loadClaudeStatus: () => void;
  loadDoctorReport: () => void;
  loadRuntimeStatus: () => void;
  loadChatReadiness: () => void;
  loadQualityReport: () => void;
  loadReleaseReadiness: () => void;
}

export function useSettingsRefreshCoordinator({
  loadSettings,
  loadIndexStatus,
  loadClaudeStatus,
  loadDoctorReport,
  loadRuntimeStatus,
  loadChatReadiness,
  loadQualityReport,
  loadReleaseReadiness,
}: SettingsRefreshCoordinatorInput) {
  const refreshActions = useMemo<SettingsRefreshActions>(
    () => ({
      settings: loadSettings,
      index: loadIndexStatus,
      claude: loadClaudeStatus,
      doctor: loadDoctorReport,
      runtime: loadRuntimeStatus,
      chat: loadChatReadiness,
      quality: loadQualityReport,
      release: loadReleaseReadiness,
    }),
    [
      loadSettings,
      loadIndexStatus,
      loadClaudeStatus,
      loadDoctorReport,
      loadRuntimeStatus,
      loadChatReadiness,
      loadQualityReport,
      loadReleaseReadiness,
    ],
  );

  useEffect(() => {
    runSettingsRefreshPlan("initial", refreshActions);
    const releaseRetry = window.setTimeout(loadReleaseReadiness, 1500);
    return () => window.clearTimeout(releaseRetry);
  }, [loadReleaseReadiness, refreshActions]);

  const refreshDoctor = useCallback(() => {
    runSettingsRefreshPlan("manual-refresh", refreshActions);
  }, [refreshActions]);

  const refreshClaudePanel = useCallback(() => {
    runSettingsRefreshPlan("claude-panel-refresh", refreshActions);
  }, [refreshActions]);

  return {
    refreshActions,
    refreshDoctor,
    refreshClaudePanel,
  };
}
