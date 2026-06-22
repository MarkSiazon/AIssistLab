import type { FirstRunChecklistAction } from "@/lib/settings/first-run-checklist";
import type { ReleaseActionSection } from "@/lib/ui/release-readiness-actions";

export interface FirstRunActionStateInput {
  action: FirstRunChecklistAction;
  saving: boolean;
  indexRebuilding: boolean;
  claudeTestLoading: boolean;
  claudeCliInstalled: boolean;
  profileActionDisabled: boolean;
}

export interface ReleaseSectionActionStateInput {
  section: ReleaseActionSection;
  saving: boolean;
  indexRebuilding: boolean;
}

export function isFirstRunActionDisabled({
  action,
  saving,
  indexRebuilding,
  claudeTestLoading,
  claudeCliInstalled,
  profileActionDisabled,
}: FirstRunActionStateInput): boolean {
  if (action === "save-settings") return saving;
  if (action === "rebuild-index") return indexRebuilding;
  if (action === "test-cli") {
    return claudeTestLoading || !claudeCliInstalled || profileActionDisabled;
  }
  return false;
}

export function getFirstRunActionDisabledHint(
  input: FirstRunActionStateInput,
): string | null {
  if (!isFirstRunActionDisabled(input)) return null;

  if (input.action === "save-settings") {
    return "Saving settings now. Try again in a moment.";
  }

  if (input.action === "rebuild-index") {
    return "Index rebuild is already running.";
  }

  if (input.action === "test-cli") {
    if (input.claudeTestLoading) return "Testing Claude CLI profile now.";
    if (!input.claudeCliInstalled) {
      return "Install or enable Claude CLI before testing.";
    }
    if (input.profileActionDisabled) {
      return "Select a Claude profile before running tests.";
    }
    return "Cannot run test right now.";
  }

  return "Action temporarily unavailable.";
}

export function isReleaseSectionActionDisabled({
  section,
  saving,
  indexRebuilding,
}: ReleaseSectionActionStateInput): boolean {
  if (section.id === "workspace" || section.id === "provider") return saving;
  if (section.id === "index") return indexRebuilding;
  return false;
}
