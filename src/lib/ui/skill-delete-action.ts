export interface SkillDeleteActionInput {
  skillName: string;
  typedName: string;
  deleting: boolean;
}

export interface SkillDeleteActionState {
  canDelete: boolean;
  buttonLabel: string;
  ariaLabel: string;
  blocker: string | null;
}

export function buildSkillDeleteActionState({
  skillName,
  typedName,
  deleting,
}: SkillDeleteActionInput): SkillDeleteActionState {
  const name = skillName.trim();
  const typed = typedName.trim();

  if (deleting) {
    return {
      canDelete: false,
      buttonLabel: "Deleting...",
      ariaLabel: `Deleting ${name} skill file`,
      blocker: "Delete is in progress.",
    };
  }

  if (typed.length === 0) {
    return {
      canDelete: false,
      buttonLabel: "Confirm delete",
      ariaLabel: `Type ${name} to confirm deletion`,
      blocker: "Type the exact skill name to enable delete.",
    };
  }

  if (typed !== name) {
    return {
      canDelete: false,
      buttonLabel: "Confirm delete",
      ariaLabel: `Type ${name} to confirm deletion`,
      blocker: `Typed name does not match ${name}.`,
    };
  }

  return {
    canDelete: true,
    buttonLabel: `Delete ${name}.md`,
    ariaLabel: `Delete ${name} skill file`,
    blocker: null,
  };
}
