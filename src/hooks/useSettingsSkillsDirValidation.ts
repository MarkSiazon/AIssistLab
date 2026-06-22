"use client";

import { useEffect } from "react";
import type { SettingsFieldType } from "@/lib/ui/settings-active-values-panel";

interface UseSettingsSkillsDirValidationInput {
  workspaceRoot: string;
  skillsDir: string;
  validatePath: (
    key: string,
    value: string,
    type: SettingsFieldType,
    workspaceRoot?: string,
  ) => void;
}

export function useSettingsSkillsDirValidation({
  workspaceRoot,
  skillsDir,
  validatePath,
}: UseSettingsSkillsDirValidationInput) {
  useEffect(() => {
    if (skillsDir) {
      validatePath("SKILLS_DIR", skillsDir, "relpath", workspaceRoot);
    }
  }, [skillsDir, validatePath, workspaceRoot]);
}
