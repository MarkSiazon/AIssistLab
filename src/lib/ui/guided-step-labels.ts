interface GuidedStepButtonLabelInput {
  index: number;
  label: string;
  total: number;
  current: boolean;
}

interface GuidedStepIndexForKeyInput {
  key: string;
  currentIndex: number;
  total: number;
}

interface GuidedStepLinearButtonLabelInput {
  currentIndex: number;
  labels: string[];
}

export function guidedStepButtonLabel({
  index,
  label,
  total,
  current,
}: GuidedStepButtonLabelInput): string {
  const stepNumber = index + 1;
  if (current) {
    return `Step ${stepNumber} of ${total}: ${label}, current step.`;
  }

  return `Go to step ${stepNumber} of ${total}: ${label}.`;
}

export function guidedStepIndexForKey({
  key,
  currentIndex,
  total,
}: GuidedStepIndexForKeyInput): number | null {
  if (total <= 0) return null;

  const lastIndex = total - 1;
  const boundedIndex = Math.min(Math.max(currentIndex, 0), lastIndex);

  if (key === "ArrowRight" || key === "ArrowDown") {
    return boundedIndex >= lastIndex ? 0 : boundedIndex + 1;
  }

  if (key === "ArrowLeft" || key === "ArrowUp") {
    return boundedIndex <= 0 ? lastIndex : boundedIndex - 1;
  }

  if (key === "Home") return 0;
  if (key === "End") return lastIndex;

  return null;
}

export function guidedStepBackButtonLabel({
  currentIndex,
  labels,
}: GuidedStepLinearButtonLabelInput): string {
  if (currentIndex <= 0) return "Already at the first step.";
  const targetIndex = currentIndex - 1;
  return `Go back to step ${targetIndex + 1} of ${labels.length}: ${labels[targetIndex]}.`;
}

export function guidedStepNextButtonLabel({
  currentIndex,
  labels,
}: GuidedStepLinearButtonLabelInput): string {
  if (currentIndex >= labels.length - 1) return "Already at the final step.";
  const targetIndex = currentIndex + 1;
  return `Go forward to step ${targetIndex + 1} of ${labels.length}: ${labels[targetIndex]}.`;
}
