"use client";

import { useMemo } from "react";
import type { ClaudeCliTestResult } from "@/lib/settings/client-api";

interface UseSettingsClaudeDerivedStateInput {
  fields: Record<string, string>;
  claudeTestResult: ClaudeCliTestResult | null;
  claudeTestSelectionKey: string | null;
  currentManualConfigDir: (fields: Record<string, string>) => string;
  currentProfileSelectionKey: (fields: Record<string, string>) => string;
  profileActionDisabled: (fields: Record<string, string>) => boolean;
}

export function useSettingsClaudeDerivedState({
  fields,
  claudeTestResult,
  claudeTestSelectionKey,
  currentManualConfigDir,
  currentProfileSelectionKey,
  profileActionDisabled,
}: UseSettingsClaudeDerivedStateInput) {
  return useMemo(() => {
    const currentSelectionKey = currentProfileSelectionKey(fields);

    return {
      currentManualConfigDir: currentManualConfigDir(fields),
      currentProfileSelectionKey: currentSelectionKey,
      profileActionsDisabled: profileActionDisabled(fields),
      claudeTestIsCurrent:
        claudeTestResult !== null &&
        claudeTestSelectionKey === currentSelectionKey,
    };
  }, [
    claudeTestResult,
    claudeTestSelectionKey,
    currentManualConfigDir,
    currentProfileSelectionKey,
    fields,
    profileActionDisabled,
  ]);
}
