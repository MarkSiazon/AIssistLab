import { useCallback } from "react";
import type { SettingsStatusMessage } from "@/components/settings/SettingsStatusBanner";
import type { ReleaseReadinessReport } from "@/lib/settings/client-api";
import {
  getSettingsReleaseActionFocusTargets,
} from "@/lib/ui/release-readiness-actions";
import { assignSafeInternalLocation } from "@/lib/ui/safe-navigation";
import { isReleaseSectionActionDisabled } from "@/lib/ui/settings-action-state";

type ReleaseSection = ReleaseReadinessReport["sections"][number];

export interface SettingsReleaseActionInput {
  saving: boolean;
  indexRebuilding: boolean;
  setStatus: (status: SettingsStatusMessage) => void;
  saveSettings: () => void;
  rebuildIndex: () => void;
}

function focusReleaseActionTarget(section: ReleaseSection): boolean {
  const targetIds = getSettingsReleaseActionFocusTargets(section);

  for (const targetId of targetIds) {
    const target = document.getElementById(targetId);
    if (!target) continue;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      if (typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    }, 150);
    return true;
  }

  return false;
}

export function useSettingsReleaseActions({
  saving,
  indexRebuilding,
  setStatus,
  saveSettings,
  rebuildIndex,
}: SettingsReleaseActionInput) {
  const isActionDisabled = useCallback(
    (section: ReleaseSection) =>
      isReleaseSectionActionDisabled({
        section,
        saving,
        indexRebuilding,
      }),
    [indexRebuilding, saving],
  );

  const runAction = useCallback(
    (section: ReleaseSection) => {
      if (section.id === "workspace" || section.id === "provider") {
        const focused = focusReleaseActionTarget(section);
        if (focused) {
          setStatus({
            type: "success",
            msg:
              section.id === "workspace"
                ? "Review the highlighted workspace paths, then save applies them."
                : "Review the highlighted provider settings, then save applies them.",
          });
        }

        saveSettings();
        return;
      }
      if (section.id === "index") {
        rebuildIndex();
        return;
      }
      assignSafeInternalLocation(window.location, section.actionHref);
    },
    [rebuildIndex, saveSettings, setStatus],
  );

  return {
    isActionDisabled,
    runAction,
  };
}
