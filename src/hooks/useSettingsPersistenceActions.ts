"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { SettingsStatusMessage } from "@/components/settings/SettingsStatusBanner";
import type { SettingsTab } from "@/components/settings/SettingsTabs";
import {
  saveSettingsFields as saveSettingsFieldsRequest,
  saveSettingsRaw as saveSettingsRawRequest,
  type ActiveRuntimeProviderStatus,
  type ClaudeProfileSelectionPayload,
} from "@/lib/settings/client-api";
import {
  runSettingsRefreshPlan,
  type SettingsRefreshActions,
} from "@/lib/ui/settings-refresh-plan";

interface SettingsPersistenceActionsInput {
  tab: SettingsTab;
  fields: Record<string, string>;
  extraFields: Record<string, string>;
  rawText: string;
  refreshActions: SettingsRefreshActions;
  buildClaudeProfileSelection: (
    fields: Record<string, string>,
  ) => ClaudeProfileSelectionPayload;
  setTab: Dispatch<SetStateAction<SettingsTab>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setStatus: Dispatch<SetStateAction<SettingsStatusMessage | null>>;
  setRawText: (value: string) => void;
  setActiveRuntime: (value: ActiveRuntimeProviderStatus) => void;
  markFieldsSaved: (nextRawText: string) => void;
  applyRawSaveResult: (input: {
    parsed: Record<string, string>;
    rawText: string;
  }) => void;
}

export function useSettingsPersistenceActions({
  tab,
  fields,
  extraFields,
  rawText,
  refreshActions,
  buildClaudeProfileSelection,
  setTab,
  setSaving,
  setStatus,
  setRawText,
  setActiveRuntime,
  markFieldsSaved,
  applyRawSaveResult,
}: SettingsPersistenceActionsInput) {
  async function saveFields() {
    setSaving(true);
    setStatus(null);
    const merged = { ...extraFields, ...fields };
    try {
      const data = await saveSettingsFieldsRequest({
        vars: merged,
        claudeProfileSelection: buildClaudeProfileSelection(fields),
      });
      const nextRaw = data.raw ?? "";
      if (data.activeRuntime) setActiveRuntime(data.activeRuntime);
      markFieldsSaved(nextRaw);
      setStatus({
        type: "success",
        msg: "Saved and applied to this server session.",
      });
      runSettingsRefreshPlan("after-settings-save", refreshActions);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveRaw() {
    setSaving(true);
    setStatus(null);
    try {
      const data = await saveSettingsRawRequest(rawText);
      if (data.activeRuntime) setActiveRuntime(data.activeRuntime);
      applyRawSaveResult({
        parsed: data.parsed ?? {},
        rawText,
      });
      setStatus({
        type: "success",
        msg: "Saved and applied to this server session.",
      });
      runSettingsRefreshPlan("after-settings-save", refreshActions);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  function saveCurrentSettings() {
    if (tab === "fields") saveFields();
    else saveRaw();
  }

  function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      setTab("raw");
      setStatus({
        type: "success",
        msg: `Imported "${file.name}". Review and save.`,
      });
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return {
    saveFields,
    saveRaw,
    saveCurrentSettings,
    handleFileImport,
  };
}
