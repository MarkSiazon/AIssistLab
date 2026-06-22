"use client";

import { useCallback, useRef, useState } from "react";
import {
  fetchClaudeCliStatus,
  getUnavailableClaudeCliStatus,
  type ClaudeCliStatus,
  type ClaudeCliTestResult,
  type ClaudeProfileSelectionPayload,
} from "@/lib/settings/client-api";
import {
  buildSettingsProfileSelectionPayload,
  getSettingsManualConfigDir,
  getSettingsProfileSelectionKey,
  isSettingsProfileActionDisabled,
  type SettingsProfileSelection,
} from "@/lib/ui/settings-profile-selection";

const defaultProfileSelection: SettingsProfileSelection = {
  profileId: "default",
  manualConfigDir: "",
};

export function useSettingsClaudeState() {
  const [claudeStatus, setClaudeStatus] = useState<ClaudeCliStatus | null>(
    null,
  );
  const [claudeStatusLoading, setClaudeStatusLoading] = useState(false);
  const [claudeActionLoading, setClaudeActionLoading] = useState(false);
  const [claudeTestLoading, setClaudeTestLoading] = useState(false);
  const [claudeTestResult, setClaudeTestResult] =
    useState<ClaudeCliTestResult | null>(null);
  const [claudeTestSelectionKey, setClaudeTestSelectionKey] =
    useState<string | null>(null);
  const [profileSelection, setProfileSelection] =
    useState<SettingsProfileSelection>(defaultProfileSelection);
  const profileSelectionTouched = useRef(false);

  const loadClaudeStatus = useCallback(async () => {
    setClaudeStatusLoading(true);
    try {
      const nextStatus = await fetchClaudeCliStatus();
      setClaudeStatus(nextStatus);
      setClaudeTestResult(nextStatus.lastCliSmokeTest);
      setClaudeTestSelectionKey(
        nextStatus.lastCliSmokeTest?.profileId
          ? `profile:${nextStatus.lastCliSmokeTest.profileId}`
          : null,
      );
      if (!profileSelectionTouched.current) {
        setProfileSelection({
          profileId: nextStatus.selectedProfile.id,
          manualConfigDir: "",
        });
      }
    } catch (err) {
      setClaudeStatus(
        getUnavailableClaudeCliStatus(
          err instanceof Error ? err.message : "Unknown error",
        ),
      );
    } finally {
      setClaudeStatusLoading(false);
    }
  }, []);

  const currentManualConfigDir = useCallback(
    (fields: Record<string, string>): string => {
      return getSettingsManualConfigDir({
        selection: profileSelection,
        fields,
      });
    },
    [profileSelection],
  );

  const currentProfileSelectionKey = useCallback(
    (fields: Record<string, string>): string => {
      return getSettingsProfileSelectionKey({
        selection: profileSelection,
        fields,
      });
    },
    [profileSelection],
  );

  const buildClaudeProfileSelection = useCallback(
    (fields: Record<string, string>): ClaudeProfileSelectionPayload => {
      return buildSettingsProfileSelectionPayload({
        selection: profileSelection,
        fields,
        fallbackProfileId: claudeStatus?.selectedProfile.id,
      });
    },
    [claudeStatus?.selectedProfile.id, profileSelection],
  );

  const profileActionDisabled = useCallback(
    (fields: Record<string, string>): boolean => {
      return isSettingsProfileActionDisabled({
        selection: profileSelection,
        fields,
      });
    },
    [profileSelection],
  );

  const markProfileSelectionChanged = useCallback(
    (next: SettingsProfileSelection) => {
      profileSelectionTouched.current = true;
      setProfileSelection(next);
    },
    [],
  );

  return {
    claudeStatus,
    claudeStatusLoading,
    claudeActionLoading,
    claudeTestLoading,
    claudeTestResult,
    claudeTestSelectionKey,
    profileSelection,
    setClaudeActionLoading,
    setClaudeTestLoading,
    setClaudeTestResult,
    setClaudeTestSelectionKey,
    loadClaudeStatus,
    currentManualConfigDir,
    currentProfileSelectionKey,
    buildClaudeProfileSelection,
    profileActionDisabled,
    markProfileSelectionChanged,
  };
}
