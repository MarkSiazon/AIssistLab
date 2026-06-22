"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserLocalStorage } from "@/lib/ui/browser-storage";
import {
  buildSettingsWorkspaceProfile,
  deleteSettingsWorkspaceProfile,
  readSettingsWorkspaceProfilesFromStorage,
  upsertSettingsWorkspaceProfile,
  writeSettingsWorkspaceProfilesToStorage,
  type SettingsWorkspaceProfile,
} from "@/lib/ui/settings-workspace-profiles-panel";

export interface SaveWorkspaceProfileInput {
  name: string;
  workspaceRoot: string;
  skillsDir: string;
}

export type SaveWorkspaceProfileResult =
  | { ok: true; profile: SettingsWorkspaceProfile; persisted: boolean }
  | { ok: false; error: string };

export function useWorkspaceProfiles() {
  const [workspaceProfiles, setWorkspaceProfiles] = useState<
    SettingsWorkspaceProfile[]
  >([]);
  const [workspaceProfileName, setWorkspaceProfileName] = useState("");

  const persistWorkspaceProfiles = useCallback(
    (nextProfiles: SettingsWorkspaceProfile[]) => {
      setWorkspaceProfiles(nextProfiles);
      const storage = getBrowserLocalStorage();
      if (!storage) return false;
      return writeSettingsWorkspaceProfilesToStorage(
        storage,
        nextProfiles,
      );
    },
    [],
  );

  useEffect(() => {
    const storage = getBrowserLocalStorage();
    if (!storage) return;
    setWorkspaceProfiles(
      readSettingsWorkspaceProfilesFromStorage(storage),
    );
  }, []);

  const saveWorkspaceProfile = useCallback(
    ({
      name,
      workspaceRoot,
      skillsDir,
    }: SaveWorkspaceProfileInput): SaveWorkspaceProfileResult => {
      if (!name.trim()) {
        return {
          ok: false,
          error: "Enter a workspace profile name first.",
        };
      }

      const profile = buildSettingsWorkspaceProfile({
        id: `${Date.now()}`,
        name,
        workspaceRoot,
        skillsDir,
      });

      const persisted = persistWorkspaceProfiles(
        upsertSettingsWorkspaceProfile({
          profiles: workspaceProfiles,
          profile,
        }),
      );
      setWorkspaceProfileName("");

      return { ok: true, profile, persisted };
    },
    [persistWorkspaceProfiles, workspaceProfiles],
  );

  const deleteWorkspaceProfile = useCallback(
    (profileId: string) => {
      persistWorkspaceProfiles(
        deleteSettingsWorkspaceProfile({
          profiles: workspaceProfiles,
          profileId,
        }),
      );
    },
    [persistWorkspaceProfiles, workspaceProfiles],
  );

  return {
    workspaceProfiles,
    workspaceProfileName,
    setWorkspaceProfileName,
    saveWorkspaceProfile,
    deleteWorkspaceProfile,
  };
}
