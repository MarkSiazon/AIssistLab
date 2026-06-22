"use client";

import {
  guidedStepBackButtonLabel,
  guidedStepNextButtonLabel,
} from "@/lib/ui/guided-step-labels";

interface GuidedStepActionsProps {
  step: number;
  steps: readonly string[];
  onStepChange: (step: number) => void;
}

export function GuidedStepActions({
  step,
  steps,
  onStepChange,
}: GuidedStepActionsProps) {
  const stepLabels = [...steps];

  return (
    <div className="guided-builder-actions">
      <button
        type="button"
        onClick={() => onStepChange(Math.max(0, step - 1))}
        disabled={step === 0}
        aria-label={guidedStepBackButtonLabel({
          currentIndex: step,
          labels: stepLabels,
        })}
        className="ui-button ui-button-secondary"
      >
        Back
      </button>
      {step < steps.length - 1 ? (
        <button
          type="button"
          onClick={() => onStepChange(Math.min(steps.length - 1, step + 1))}
          aria-label={guidedStepNextButtonLabel({
            currentIndex: step,
            labels: stepLabels,
          })}
          className="ui-button ui-button-primary"
        >
          Next
        </button>
      ) : null}
    </div>
  );
}
