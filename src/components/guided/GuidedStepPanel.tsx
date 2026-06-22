"use client";

import { GuidedBoundariesStep } from "@/components/guided/GuidedBoundariesStep";
import { GuidedPromptStep } from "@/components/guided/GuidedPromptStep";
import { GuidedReviewStep } from "@/components/guided/GuidedReviewStep";
import { GuidedTemplateStep } from "@/components/guided/GuidedTemplateStep";
import type { GuidedTextField } from "@/components/guided/GuidedStepTextArea";
import type { GuidedHandoffState } from "@/lib/ui/guided-handoff";
import type {
  GuidedDraft,
  GuidedFeedback,
  GuidedValidationError,
  SkillTemplateSummary,
} from "@/lib/ui/guided-builder-model";

interface GuidedStepPanelProps {
  step: number;
  templates: SkillTemplateSummary[];
  templateId: string;
  selectedTemplate: SkillTemplateSummary | undefined;
  values: Record<GuidedTextField, string>;
  validationErrors: GuidedValidationError[];
  feedback: GuidedFeedback | null;
  draft: GuidedDraft | null;
  loading: boolean;
  handoffState: GuidedHandoffState;
  onTemplateChange: (templateId: string) => void;
  onFieldChange: (field: GuidedTextField, value: string) => void;
  onReviewDraft: () => void;
  onBuildDraft: () => void;
  onOpenInEditor: () => void;
}

export function GuidedStepPanel({
  step,
  templates,
  templateId,
  selectedTemplate,
  values,
  validationErrors,
  feedback,
  draft,
  loading,
  handoffState,
  onTemplateChange,
  onFieldChange,
  onReviewDraft,
  onBuildDraft,
  onOpenInEditor,
}: GuidedStepPanelProps) {
  let content;

  if (step === 0) {
    content = (
      <GuidedTemplateStep
        templates={templates}
        templateId={templateId}
        selectedTemplate={selectedTemplate}
        values={values}
        validationErrors={validationErrors}
        onTemplateChange={onTemplateChange}
        onFieldChange={onFieldChange}
      />
    );
  } else if (step === 1) {
    content = (
      <GuidedPromptStep
        values={values}
        validationErrors={validationErrors}
        onFieldChange={onFieldChange}
      />
    );
  } else if (step === 2) {
    content = (
      <GuidedBoundariesStep
        values={values}
        validationErrors={validationErrors}
        onFieldChange={onFieldChange}
      />
    );
  } else {
    content = (
      <GuidedReviewStep
        feedback={feedback}
        draft={draft}
        loading={loading}
        handoffState={handoffState}
        onReviewDraft={onReviewDraft}
        onBuildDraft={onBuildDraft}
        onOpenInEditor={onOpenInEditor}
      />
    );
  }

  return (
    <section
      className="ui-panel guided-step-panel"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {content}
    </section>
  );
}
