import { isSafeInternalActionHref } from "./internal-action-href";

type ReleaseActionSectionStatus = "ready" | "needs_action" | "blocked";

export interface ReleaseActionSection {
  id: string;
  status: ReleaseActionSectionStatus;
  actionLabel?: string;
  actionHref?: string;
}

export interface SettingsReleaseActionPresentation {
  label: string;
  ariaLabel: string;
}

function settingsFieldId(key: string): string {
  return `settings-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export { isSafeInternalActionHref };

function hasAction(section: ReleaseActionSection): boolean {
  return (
    Boolean(section.actionLabel) && isSafeInternalActionHref(section.actionHref)
  );
}

export function selectReleasePrimaryAction<
  TSection extends ReleaseActionSection,
>(sections: readonly TSection[]): TSection | undefined {
  return (
    sections.find((section) => section.status !== "ready" && hasAction(section)) ??
    sections.find(hasAction)
  );
}

export function shouldShowReleaseSectionAction({
  section,
  primaryAction,
  topActionVisible,
  currentPath,
}: {
  section: ReleaseActionSection;
  primaryAction: ReleaseActionSection | undefined;
  topActionVisible: boolean;
  currentPath?: string;
}): boolean {
  if (!hasAction(section)) return false;
  if (topActionVisible && primaryAction?.id === section.id) return false;
  if (
    currentPath &&
    section.actionHref === currentPath &&
    section.actionLabel === "Open Settings"
  ) {
    return false;
  }
  return true;
}

export function getSettingsReleaseActionPresentation({
  section,
  saving,
  indexRebuilding,
}: {
  section: ReleaseActionSection;
  saving: boolean;
  indexRebuilding: boolean;
}): SettingsReleaseActionPresentation {
  if (section.id === "workspace") {
    return saving
      ? {
          label: "Saving...",
          ariaLabel: "Saving workspace and skills path settings",
        }
      : {
          label: "Save Paths",
          ariaLabel: "Save workspace and skills path settings",
        };
  }

  if (section.id === "provider") {
    return saving
      ? {
          label: "Saving...",
          ariaLabel: "Saving provider settings",
        }
      : {
          label: "Save Provider",
          ariaLabel: "Save provider settings",
        };
  }

  if (section.id === "index") {
    return indexRebuilding
      ? {
          label: "Rebuilding...",
          ariaLabel: "Rebuilding RAG index",
        }
      : {
          label: "Rebuild Index",
          ariaLabel: "Rebuild RAG index",
        };
  }

  const label = section.actionLabel ?? "Open";
  return {
    label,
    ariaLabel: label,
  };
}

export function getSettingsReleaseActionFocusTargets(
  section: ReleaseActionSection,
): string[] {
  if (section.id === "workspace") {
    return [settingsFieldId("WORKSPACE_ROOT"), settingsFieldId("SKILLS_DIR")];
  }

  if (section.id === "provider") {
    return [
      settingsFieldId("ANTHROPIC_API_KEY"),
      settingsFieldId("LLM_PROVIDER"),
      settingsFieldId("ENABLE_LOCAL_CLAUDE_CLI"),
    ];
  }

  return [];
}
