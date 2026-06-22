import type {
  FirstRunChecklistItem,
  FirstRunChecklistStatus,
} from "@/lib/settings/first-run-checklist";

export interface FirstRunChecklistSummary {
  readyCount: number;
  needsActionCount: number;
  totalCount: number;
  nextItem: FirstRunChecklistItem | null;
}

export function getFirstRunChecklistSummary(
  items: FirstRunChecklistItem[],
): FirstRunChecklistSummary {
  return {
    readyCount: items.filter((item) => item.status === "ready").length,
    needsActionCount: items.filter((item) => item.status === "needs_action")
      .length,
    totalCount: items.length,
    nextItem:
      items.find((item) => item.status === "needs_action") ??
      items.find((item) => item.status === "optional") ??
      null,
  };
}

export function shouldShowFirstRunAction(
  item: Pick<FirstRunChecklistItem, "action" | "id" | "status">,
): boolean {
  return Boolean(
    item.action &&
      (item.status !== "ready" || item.id === "chat" || item.id === "diagnostics"),
  );
}

export function firstRunActionHelpId({
  itemId,
  actionDisabled,
  disabledHint,
}: {
  itemId: string;
  actionDisabled: boolean;
  disabledHint: string | null;
}): string | undefined {
  if (!actionDisabled || !disabledHint) return undefined;
  return `first-run-action-help-${itemId}`;
}

export function firstRunNextStepLabel(
  status: FirstRunChecklistStatus,
): "Next step" | "Optional final step" {
  return status === "optional" ? "Optional final step" : "Next step";
}
