"use client";

import { useMemo } from "react";
import { useGuidedAutosave } from "@/hooks/useGuidedAutosave";
import { useGuidedBuilderFormState } from "@/hooks/useGuidedBuilderFormState";
import { useGuidedDraftWorkflow } from "@/hooks/useGuidedDraftWorkflow";
import { useGuidedTemplates } from "@/hooks/useGuidedTemplates";
import { GUIDED_STEPS } from "@/lib/ui/guided-builder-model";
import { buildGuidedChecklist } from "@/lib/ui/guided-checklist";
import { buildGuidedHandoffState } from "@/lib/ui/guided-handoff";

export function useGuidedBuilderController() {
  const form = useGuidedBuilderFormState();
  const { templates, selectedTemplate } = useGuidedTemplates(
    form.templateId,
    form.setTemplateId,
  );
  const workflow = useGuidedDraftWorkflow({
    input: form.input,
    setStep: form.setStep,
  });

  const stepProgress = Math.round(((form.step + 1) / GUIDED_STEPS.length) * 100);
  const checklistState = useMemo(
    () =>
      buildGuidedChecklist({
        selectedTemplateLabel: selectedTemplate?.label,
        purpose: form.values.purpose,
        audience: form.values.audience,
        triggerExampleCount: form.input.triggerExamples.length,
        requiredInputCount: form.input.requiredInputs.length,
        boundaryCount: form.input.boundaries.length,
        successCriteriaCount: form.input.successCriteria.length,
        feedbackScore: workflow.feedback?.score,
      }),
    [
      form.input.boundaries.length,
      form.input.requiredInputs.length,
      form.input.successCriteria.length,
      form.input.triggerExamples.length,
      form.values.audience,
      form.values.purpose,
      selectedTemplate?.label,
      workflow.feedback?.score,
    ],
  );
  const handoffState = useMemo(
    () =>
      buildGuidedHandoffState({
        requiredReady: checklistState.requiredReady,
        loading: workflow.loading,
        feedback: workflow.feedback,
        draftReady: Boolean(workflow.draft),
      }),
    [
      checklistState.requiredReady,
      workflow.draft,
      workflow.feedback,
      workflow.loading,
    ],
  );

  const autosave = useGuidedAutosave({
    formSnapshotInput: form.formSnapshotInput,
    formHasContent: form.formHasContent,
    onRestoreSnapshot: form.restoreSnapshot,
    onClearForm: () => {
      form.resetFormFields();
      workflow.resetWorkflowState();
    },
  });

  function changeTemplate(nextTemplateId: string) {
    form.setTemplateId(nextTemplateId);
    workflow.clearDraftState();
  }

  function changeField(
    field:
      | "purpose"
      | "audience"
      | "triggerExamples"
      | "requiredInputs"
      | "boundaries"
      | "successCriteria",
    value: string,
  ) {
    form.changeField(field, value);
    workflow.clearDraftState();
  }

  return {
    step: form.step,
    setStep: form.setStep,
    templates,
    templateId: form.templateId,
    selectedTemplate,
    stepProgress,
    validationErrors: workflow.validationErrors,
    message: workflow.message,
    feedback: workflow.feedback,
    draft: workflow.draft,
    loading: workflow.loading,
    handoffState,
    values: form.values,
    autosave,
    stepPanel: {
      changeTemplate,
      changeField,
      reviewDraft: workflow.reviewDraft,
      buildDraft: workflow.buildDraft,
      openInEditor: workflow.openInEditor,
    },
    sidebar: {
      purpose: form.values.purpose,
      templateLabel: selectedTemplate?.label ?? null,
      feedbackScore: workflow.feedback?.score ?? null,
      metrics: [
        { label: "Triggers", value: form.input.triggerExamples.length },
        { label: "Inputs", value: form.input.requiredInputs.length },
        { label: "Boundaries", value: form.input.boundaries.length },
        { label: "Criteria", value: form.input.successCriteria.length },
      ],
      checklist: checklistState,
    },
  };
}
