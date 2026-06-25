import { countLabel } from "@/lib/format/count-label";

export type GuidedChecklistStatus = "ready" | "needs_action" | "optional";

interface GuidedChecklistItem {
  id: string;
  label: string;
  status: GuidedChecklistStatus;
  statusLabel: string;
  message: string;
  stepIndex: number;
  required: boolean;
}

export interface GuidedChecklistState {
  items: GuidedChecklistItem[];
  requiredItems: GuidedChecklistItem[];
  completedRequiredCount: number;
  requiredReady: boolean;
  readinessSummary: string;
}

export interface GuidedChecklistInput {
  selectedTemplateLabel?: string | null;
  purpose: string;
  audience: string;
  triggerExampleCount: number;
  requiredInputCount: number;
  boundaryCount: number;
  successCriteriaCount: number;
  feedbackScore?: number | null;
}

export function guidedChecklistStatusColor(
  status: GuidedChecklistStatus,
): string {
  if (status === "ready") return "var(--green)";
  if (status === "needs_action") return "var(--yellow)";
  return "var(--text-muted)";
}

export function buildGuidedChecklist({
  selectedTemplateLabel,
  purpose,
  audience,
  triggerExampleCount,
  requiredInputCount,
  boundaryCount,
  successCriteriaCount,
  feedbackScore,
}: GuidedChecklistInput): GuidedChecklistState {
  const purposeReady = purpose.trim().length >= 12;
  const audienceReady = audience.trim().length > 0;
  const hasTemplate = Boolean(selectedTemplateLabel);
  const hasFeedback = typeof feedbackScore === "number";
  const items: GuidedChecklistItem[] = [
    {
      id: "template",
      label: "Template selected",
      status: hasTemplate ? "ready" : "needs_action",
      statusLabel: hasTemplate ? "Ready" : "Needs detail",
      message: selectedTemplateLabel ?? "Choose a template before building.",
      stepIndex: 0,
      required: true,
    },
    {
      id: "purpose",
      label: "Purpose is concrete",
      status: purposeReady ? "ready" : "needs_action",
      statusLabel: purposeReady ? "Ready" : "Needs detail",
      message: purposeReady
        ? "Task and outcome are named."
        : "Add a task and expected output.",
      stepIndex: 0,
      required: true,
    },
    {
      id: "audience",
      label: "Audience named",
      status: audienceReady ? "ready" : "needs_action",
      statusLabel: audienceReady ? "Ready" : "Needs detail",
      message: audienceReady
        ? "Tone and assumptions can be specific."
        : "Describe who will use this skill.",
      stepIndex: 0,
      required: true,
    },
    {
      id: "triggers",
      label: "Trigger examples",
      status: triggerExampleCount > 0 ? "ready" : "needs_action",
      statusLabel: triggerExampleCount > 0 ? "Ready" : "Needs detail",
      message:
        triggerExampleCount > 0
          ? `${countLabel(triggerExampleCount, "example prompt")} captured.`
          : "Add at least one realistic user prompt.",
      stepIndex: 1,
      required: true,
    },
    {
      id: "criteria",
      label: "Success criteria",
      status: successCriteriaCount > 0 ? "ready" : "needs_action",
      statusLabel: successCriteriaCount > 0 ? "Ready" : "Needs detail",
      message:
        successCriteriaCount > 0
          ? `${countLabel(successCriteriaCount, "rubric check")} ready.`
          : "Add at least one measurable quality bar.",
      stepIndex: 2,
      required: true,
    },
    {
      id: "inputs",
      label: "Required inputs",
      status: requiredInputCount > 0 ? "ready" : "optional",
      statusLabel: requiredInputCount > 0 ? "Ready" : "Optional",
      message:
        requiredInputCount > 0
          ? `${countLabel(requiredInputCount, "input")} listed.`
          : "List inputs when the skill depends on source material.",
      stepIndex: 1,
      required: false,
    },
    {
      id: "boundaries",
      label: "Boundaries",
      status: boundaryCount > 0 ? "ready" : "optional",
      statusLabel: boundaryCount > 0 ? "Ready" : "Optional",
      message:
        boundaryCount > 0
          ? `${countLabel(boundaryCount, "boundary rule")} added.`
          : "Add safety or scope limits for higher-quality drafts.",
      stepIndex: 2,
      required: false,
    },
    {
      id: "feedback",
      label: "Rubric feedback",
      status: hasFeedback ? "ready" : "optional",
      statusLabel: hasFeedback ? "Ready" : "Not run",
      message: hasFeedback
        ? `Latest score is ${feedbackScore}/100.`
        : "Run Review Draft before final editing when possible.",
      stepIndex: 3,
      required: false,
    },
  ];
  const requiredItems = items.filter((item) => item.required);
  const completedRequiredCount = requiredItems.filter(
    (item) => item.status === "ready",
  ).length;
  const requiredReady = completedRequiredCount === requiredItems.length;
  const remainingRequiredCount = requiredItems.length - completedRequiredCount;

  return {
    items,
    requiredItems,
    completedRequiredCount,
    requiredReady,
    readinessSummary: requiredReady
      ? "Ready for rubric review"
      : `${countLabel(remainingRequiredCount, "required item")} left before review`,
  };
}
