import { useCallback, useMemo } from "react";
import {
  buildFirstRunChecklist,
  type FirstRunChecklistAction,
  type FirstRunChecklistInput,
} from "@/lib/settings/first-run-checklist";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import {
  getFirstRunActionDisabledHint,
  isFirstRunActionDisabled,
} from "@/lib/ui/settings-action-state";
import { markDiagnosticsExportedThisSession } from "@/lib/ui/diagnostics-export-session";
import { assignSafeInternalLocation } from "@/lib/ui/safe-navigation";

export interface SettingsFirstRunActionInput
  extends FirstRunChecklistInput {
  saving: boolean;
  indexRebuilding: boolean;
  claudeTestLoading: boolean;
  claudeCliInstalled: boolean;
  profileActionDisabled: boolean;
  setDiagnosticsExported: (exported: boolean) => void;
  saveSettings: () => void;
  rebuildIndex: () => void;
  testClaudeCli: () => void;
}

export function useSettingsFirstRunActions({
  doctorChecks,
  indexStatus,
  runtimeStatus,
  chatStatus,
  diagnosticsExported,
  saving,
  indexRebuilding,
  claudeTestLoading,
  claudeCliInstalled,
  profileActionDisabled,
  setDiagnosticsExported,
  saveSettings,
  rebuildIndex,
  testClaudeCli,
}: SettingsFirstRunActionInput) {
  const items = useMemo(
    () =>
      buildFirstRunChecklist({
        doctorChecks,
        indexStatus,
        runtimeStatus,
        chatStatus,
        diagnosticsExported,
      }),
    [
      chatStatus,
      diagnosticsExported,
      doctorChecks,
      indexStatus,
      runtimeStatus,
    ],
  );

  const actionState = useCallback(
    (action: FirstRunChecklistAction) => ({
      action,
      saving,
      indexRebuilding,
      claudeTestLoading,
      claudeCliInstalled,
      profileActionDisabled,
    }),
    [
      claudeCliInstalled,
      claudeTestLoading,
      indexRebuilding,
      profileActionDisabled,
      saving,
    ],
  );

  const isActionDisabled = useCallback(
    (action: FirstRunChecklistAction) =>
      isFirstRunActionDisabled(actionState(action)),
    [actionState],
  );

  const getActionHint = useCallback(
    (action: FirstRunChecklistAction) =>
      getFirstRunActionDisabledHint(actionState(action)),
    [actionState],
  );

  const runAction = useCallback(
    (action: FirstRunChecklistAction) => {
      if (action === "save-settings") {
        saveSettings();
        return;
      }
      if (action === "rebuild-index") {
        rebuildIndex();
        return;
      }
      if (action === "test-cli") {
        testClaudeCli();
        return;
      }
      if (action === "open-chat") {
        assignSafeInternalLocation(window.location, APP_ROUTES.chat);
        return;
      }
      if (action === "export-diagnostics") {
        setDiagnosticsExported(true);
        markDiagnosticsExportedThisSession();
        assignSafeInternalLocation(window.location, APP_ROUTES.exportDiagnostics);
      }
    },
    [rebuildIndex, saveSettings, setDiagnosticsExported, testClaudeCli],
  );

  return {
    items,
    isActionDisabled,
    getActionHint,
    runAction,
  };
}
