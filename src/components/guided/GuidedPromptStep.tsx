import {
  GuidedStepTextArea,
  type GuidedTextField,
} from "@/components/guided/GuidedStepTextArea";
import type { GuidedValidationError } from "@/lib/ui/guided-builder-model";

interface GuidedPromptStepProps {
  values: Record<GuidedTextField, string>;
  validationErrors: GuidedValidationError[];
  onFieldChange: (field: GuidedTextField, value: string) => void;
}

export function GuidedPromptStep({
  values,
  validationErrors,
  onFieldChange,
}: GuidedPromptStepProps) {
  return (
    <div className="guided-step-content">
      <div className="guided-step-question">
        What would a user actually ask when this skill should activate?
      </div>
      <GuidedStepTextArea
        field="triggerExamples"
        id="guided-trigger-examples"
        label="Trigger examples"
        help="Add one example per line using the same words a real user would type."
        values={values}
        placeholder={"Turn these notes into a postmortem outline.\nReview this outage timeline and identify follow-up actions."}
        validationErrors={validationErrors}
        onFieldChange={onFieldChange}
      />
      <GuidedStepTextArea
        field="requiredInputs"
        id="guided-required-inputs"
        label="Required inputs"
        help="List the concrete inputs the skill needs before it can produce a useful answer."
        values={values}
        placeholder={"timeline notes\ncustomer impact\nowner names"}
        validationErrors={validationErrors}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}
