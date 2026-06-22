"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { restoreDeletedSkill } from "@/lib/skills/client-api";
import { buildSkillRestoreActionState } from "@/lib/ui/skill-restore-action";
import type { DeletedSkillSummary } from "@/lib/ui/skills-import-panel-model";

interface SkillRestoreWorkflowInput {
  latestDeleted?: DeletedSkillSummary | null;
  setLifecycleMessage: Dispatch<SetStateAction<string | null>>;
  refreshLibraryState: () => Promise<void>;
  selectSkill: (name: string) => Promise<void>;
}

export function useSkillRestoreWorkflow({
  latestDeleted,
  setLifecycleMessage,
  refreshLibraryState,
  selectSkill,
}: SkillRestoreWorkflowInput) {
  const [restoreLoading, setRestoreLoading] = useState(false);
  const restoreAction = buildSkillRestoreActionState({
    skillName: latestDeleted?.skillName ?? null,
    restoring: restoreLoading,
  });

  async function restoreLatestDeleted() {
    if (!latestDeleted) return;
    const name = latestDeleted.skillName;
    setRestoreLoading(true);
    try {
      await restoreDeletedSkill(name);
      setLifecycleMessage("Restored latest deleted skill. Index marked stale.");
      await refreshLibraryState();
      await selectSkill(name);
    } catch (err) {
      setLifecycleMessage(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setRestoreLoading(false);
    }
  }

  return {
    restoreAction,
    restoreLatestDeleted,
  };
}
