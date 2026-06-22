import {
  GuidedStepTextArea,
  guidedFieldError,
  type GuidedTextField,
} from "@/components/guided/GuidedStepTextArea";
import {
  guidedFieldStyle,
  templateCategoryLabel,
  type GuidedValidationError,
  type SkillTemplateSummary,
} from "@/lib/ui/guided-builder-model";

interface GuidedTemplateStepProps {
  templates: SkillTemplateSummary[];
  templateId: string;
  selectedTemplate: SkillTemplateSummary | undefined;
  values: Record<GuidedTextField, string>;
  validationErrors: GuidedValidationError[];
  onTemplateChange: (templateId: string) => void;
  onFieldChange: (field: GuidedTextField, value: string) => void;
}

export function GuidedTemplateStep({
  templates,
  templateId,
  selectedTemplate,
  values,
  validationErrors,
  onTemplateChange,
  onFieldChange,
}: GuidedTemplateStepProps) {
  const templateError = guidedFieldError(validationErrors, "templateId");

  return (
    <div className="guided-step-content">
      <div className="guided-field">
        <label className="guided-field-label" htmlFor="guided-template">
          Template
        </label>
        <select
          id="guided-template"
          value={templateId}
          onChange={(event) => onTemplateChange(event.target.value)}
          className="guided-select"
          aria-invalid={templateError ? "true" : "false"}
          aria-describedby={`guided-template-help${
            templateError ? " guided-template-error" : ""
          }`}
          style={guidedFieldStyle()}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>
        <div id="guided-template-help" className="guided-field-help">
          Start from the template that best matches how this skill will be used.
        </div>
        {templateError && (
          <div id="guided-template-error" className="guided-field-error" role="alert">
            {templateError}
          </div>
        )}
      </div>
      {selectedTemplate ? (
        <section className="guided-template-card">
          <div className="guided-template-card-header">
            <span className="guided-template-card-title">
              {selectedTemplate.label}
            </span>
            <span className="guided-template-card-badge">
              {templateCategoryLabel(selectedTemplate.category)}
            </span>
          </div>
          <div className="guided-template-card-description">
            {selectedTemplate.description}
          </div>
        </section>
      ) : (
        <div className="guided-template-card-muted">
          Template loading. Pick one to see detailed guidance.
        </div>
      )}
      <GuidedStepTextArea
        field="purpose"
        id="guided-purpose"
        label="Purpose"
        help="Name the work this skill helps with and the output it should produce."
        values={values}
        placeholder="Help support leads turn escalation notes into a calm response plan."
        rows={4}
        validationErrors={validationErrors}
        onFieldChange={onFieldChange}
      />
      <GuidedStepTextArea
        field="audience"
        id="guided-audience"
        label="Audience"
        help="Describe who will use this skill so tone, assumptions, and examples stay specific."
        values={values}
        placeholder="Support leads managing urgent customer escalations."
        rows={3}
        validationErrors={validationErrors}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}
