export interface SkillRestoreActionInput {
  skillName: string | null;
  restoring: boolean;
}

export interface SkillRestoreActionState {
  canRestore: boolean;
  buttonLabel: string;
  ariaLabel: string;
  statusLabel: string;
  helpText: string;
}

export function buildSkillRestoreActionState({
  skillName,
  restoring,
}: SkillRestoreActionInput): SkillRestoreActionState {
  const name = skillName?.trim() || null;

  if (!name) {
    return {
      canRestore: false,
      buttonLabel: "Restore latest",
      ariaLabel: "No deleted skill backup is available to restore",
      statusLabel: "No backup",
      helpText: "Delete a skill before restore is available.",
    };
  }

  if (restoring) {
    return {
      canRestore: false,
      buttonLabel: "Restoring...",
      ariaLabel: `Restoring ${name} from local backup`,
      statusLabel: "Restoring",
      helpText: "Restoring from local backup and marking the index stale.",
    };
  }

  return {
    canRestore: true,
    buttonLabel: `Restore ${name}`,
    ariaLabel: `Restore ${name} from local backup`,
    statusLabel: "Backup available",
    helpText:
      "Restores the latest deleted copy only when it will not overwrite a recreated skill.",
  };
}
