import { GuidedTextareaField } from "@/components/guided/GuidedTextareaField";
import type { GuidedValidationError } from "@/lib/ui/guided-builder-model";

export type GuidedTextField =
  | "purpose"
  | "audience"
  | "triggerExamples"
  | "requiredInputs"
  | "boundaries"
  | "successCriteria";

interface GuidedStepTextAreaProps {
  field: GuidedTextField;
  id: string;
  label: string;
  help: string;
  placeholder: string;
  values: Record<GuidedTextField, string>;
  validationErrors: GuidedValidationError[];
  rows?: number;
  onFieldChange: (field: GuidedTextField, value: string) => void;
}

export function guidedFieldError(
  errors: GuidedValidationError[],
  field: string,
): string | undefined {
  return errors.find((error) => error.field === field)?.message;
}

export function GuidedStepTextArea({
  field,
  id,
  label,
  help,
  placeholder,
  values,
  validationErrors,
  rows = 5,
  onFieldChange,
}: GuidedStepTextAreaProps) {
  return (
    <GuidedTextareaField
      field={field}
      id={id}
      label={label}
      help={help}
      value={values[field]}
      placeholder={placeholder}
      rows={rows}
      error={guidedFieldError(validationErrors, field)}
      onChange={(value) => onFieldChange(field, value)}
    />
  );
}
