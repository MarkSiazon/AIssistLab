"use client";

import { GuidedAutosavePanel } from "@/components/guided/GuidedAutosavePanel";
import { GuidedBuilderHeader } from "@/components/guided/GuidedBuilderHeader";
import { GuidedInlineStatus } from "@/components/guided/GuidedInlineStatus";
import { GuidedProgressNav } from "@/components/guided/GuidedProgressNav";
import { GuidedStepActions } from "@/components/guided/GuidedStepActions";
import { GuidedStepPanel } from "@/components/guided/GuidedStepPanel";
import { GuidedSummarySidebar } from "@/components/guided/GuidedSummarySidebar";
import { GuidedValidationAlert } from "@/components/guided/GuidedValidationAlert";
import { useGuidedBuilderController } from "@/hooks/useGuidedBuilderController";
import {
  GUIDED_STEP_GUIDANCE,
  GUIDED_STEPS,
} from "@/lib/ui/guided-builder-model";

export default function GuidedSkillBuilderPage() {
  const controller = useGuidedBuilderController();

  return (
    <div className="guided-builder-shell">
      <div className="guided-builder-main">
        <div className="guided-builder-content">
          <GuidedBuilderHeader />

          <GuidedAutosavePanel
            message={controller.autosave.message}
            canClear={controller.autosave.canClear}
            confirmOpen={controller.autosave.confirmOpen}
            onRequestClear={controller.autosave.requestClear}
            onCancelClear={controller.autosave.cancelClear}
            onConfirmClear={controller.autosave.confirmClear}
          />

          <GuidedProgressNav
            step={controller.step}
            steps={GUIDED_STEPS}
            guidance={GUIDED_STEP_GUIDANCE}
            progress={controller.stepProgress}
            onSelectStep={controller.setStep}
          />

          <GuidedValidationAlert errors={controller.validationErrors} />

          <GuidedInlineStatus message={controller.message} />

          <GuidedStepPanel
            step={controller.step}
            templates={controller.templates}
            templateId={controller.templateId}
            selectedTemplate={controller.selectedTemplate}
            values={controller.values}
            validationErrors={controller.validationErrors}
            feedback={controller.feedback}
            draft={controller.draft}
            loading={controller.loading}
            handoffState={controller.handoffState}
            onTemplateChange={controller.stepPanel.changeTemplate}
            onFieldChange={controller.stepPanel.changeField}
            onReviewDraft={controller.stepPanel.reviewDraft}
            onBuildDraft={() => {
              void controller.stepPanel.buildDraft();
            }}
            onOpenInEditor={() => {
              void controller.stepPanel.openInEditor();
            }}
          />

          <GuidedStepActions
            step={controller.step}
            steps={GUIDED_STEPS}
            onStepChange={controller.setStep}
          />
        </div>
      </div>

      <GuidedSummarySidebar
        purpose={controller.sidebar.purpose}
        templateLabel={controller.sidebar.templateLabel}
        feedbackScore={controller.sidebar.feedbackScore}
        metrics={controller.sidebar.metrics}
        checklist={controller.sidebar.checklist}
        stepLabels={GUIDED_STEPS}
        onSelectStep={controller.setStep}
      />
    </div>
  );
}
