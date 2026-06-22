"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SettingsStatusMessage } from "@/components/settings/SettingsStatusBanner";
import type { PublicIndexState } from "@/lib/rag/index-state";
import {
  runSettingsRefreshPlan,
  type SettingsRefreshActions,
} from "@/lib/ui/settings-refresh-plan";

interface SettingsIndexActionInput {
  refreshActions: SettingsRefreshActions;
  rebuildIndex: () => Promise<PublicIndexState>;
  setStatus: Dispatch<SetStateAction<SettingsStatusMessage | null>>;
}

export function useSettingsIndexAction({
  refreshActions,
  rebuildIndex,
  setStatus,
}: SettingsIndexActionInput) {
  async function rebuildIndexFromSettings() {
    setStatus(null);
    try {
      const data = await rebuildIndex();
      setStatus({
        type: "success",
        msg: `Index ${data.status}: ${data.skillCount} skills, ${data.chunkCount} chunks.`,
      });
      runSettingsRefreshPlan("after-index-rebuild", refreshActions);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Unable to rebuild index",
      });
    }
  }

  return {
    rebuildIndexFromSettings,
  };
}
