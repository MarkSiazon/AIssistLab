"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SettingsStatusMessage } from "@/components/settings/SettingsStatusBanner";
import type { SettingsWorkspaceProfile } from "@/lib/ui/settings-workspace-profiles-panel";

interface SettingsWorkspaceProfileActionsInput {
  fields: Record<string, string>;
  workspaceProfileName: string;
  applyFieldValues: (values: Record<string, string>) => void;
  saveWorkspaceProfileEntry: (input: {
    name: string;
    workspaceRoot: string;
    skillsDir: string;
  }) => { ok: true; persisted: boolean } | { ok: false; error: string };
  setStatus: Dispatch<SetStateAction<SettingsStatusMessage | null>>;
}

export function useSettingsWorkspaceProfileActions({
  fields,
  workspaceProfileName,
  applyFieldValues,
  saveWorkspaceProfileEntry,
  setStatus,
}: SettingsWorkspaceProfileActionsInput) {
  function saveWorkspaceProfile() {
    const result = saveWorkspaceProfileEntry({
      name: workspaceProfileName,
      workspaceRoot: fields.WORKSPACE_ROOT ?? "",
      skillsDir: fields.SKILLS_DIR ?? ".claude/skills",
    });

    if (!result.ok) {
      setStatus({
        type: "error",
        msg: result.error,
      });
      return;
    }

    setStatus({
      type: result.persisted ? "success" : "error",
      msg: result.persisted
        ? "Workspace profile saved locally."
        : "Workspace profile is available in this tab, but browser storage is unavailable.",
    });
  }

  function applyWorkspaceProfile(profile: SettingsWorkspaceProfile) {
    applyFieldValues({
      WORKSPACE_ROOT: profile.workspaceRoot,
      SKILLS_DIR: profile.skillsDir,
    });
    setStatus({
      type: "success",
      msg: "Workspace profile applied. Save settings, then rebuild the index.",
    });
  }

  return {
    saveWorkspaceProfile,
    applyWorkspaceProfile,
  };
}
