import {
  GuidedStepTextArea,
  type GuidedTextField,
} from "@/components/guided/GuidedStepTextArea";
import type { GuidedValidationError } from "@/lib/ui/guided-builder-model";

interface GuidedBoundariesStepProps {
  values: Record<GuidedTextField, string>;
  validationErrors: GuidedValidationError[];
  onFieldChange: (field: GuidedTextField, value: string) => void;
}

export function GuidedBoundariesStep({
  values,
  validationErrors,
  onFieldChange,
}: GuidedBoundariesStepProps) {
  return (
    <div className="guided-step-content">
      <div className="guided-step-question">
        What should the assistant refuse to assume, expose, or invent?
      </div>
      <GuidedStepTextArea
        field="boundaries"
        id="guided-boundaries"
        label="Boundaries"
        help="List what the assistant should refuse to assume, expose, or invent."
        values={values}
        placeholder={"Do not invent root causes that are not supported by the notes.\nFlag missing evidence instead of filling gaps."}
        validationErrors={validationErrors}
        onFieldChange={onFieldChange}
      />
      <GuidedStepTextArea
        field="successCriteria"
        id="guided-success-criteria"
        label="Success criteria"
        help="Add one measurable quality bar per line so the rubric can evaluate the draft."
        values={values}
        placeholder={"The answer separates facts, hypotheses, and actions.\nEach action has an owner and verification step."}
        validationErrors={validationErrors}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}
