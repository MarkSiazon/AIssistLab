"use client";

import { SkillEditorBodyPanel } from "@/components/editor/SkillEditorBodyPanel";
import { SkillEditorHeader } from "@/components/editor/SkillEditorHeader";
import { SkillEditorLivePreview } from "@/components/editor/SkillEditorLivePreview";
import { SkillEditorMetadataPanel } from "@/components/editor/SkillEditorMetadataPanel";
import { useSkillEditorFormState } from "@/hooks/useSkillEditorFormState";
import { useSkillEditorTabs } from "@/hooks/useSkillEditorTabs";

interface Props {
  initialName?: string;
  initialDescription?: string;
  initialTags?: string[];
  initialFrontmatter?: Record<string, unknown>;
  initialBody?: string;
  mode: "create" | "edit";
}

const DEFAULT_SKILL_BODY = `## Instructions

Describe what this skill does step by step.

### Step 1 - ...

\`\`\`bash
# example command
\`\`\`

## Rules

- Be specific and concrete
- Omit any section that has no items
`;

export function SkillEditorForm({
  initialName = "",
  initialDescription = "",
  initialTags = [],
  initialFrontmatter = {},
  initialBody = DEFAULT_SKILL_BODY,
  mode,
}: Props) {
  const tabs = useSkillEditorTabs();
  const editor = useSkillEditorFormState({
    initialName,
    initialDescription,
    initialTags,
    initialFrontmatter,
    initialBody,
    mode,
  });

  return (
    <div className="skill-editor-shell">
      <SkillEditorHeader
        mode={mode}
        name={editor.name}
        error={editor.error}
        saved={editor.saved}
        savedMessage={editor.savedMessage}
        hasUnsavedChanges={editor.hasUnsavedChanges}
        confirmDiscard={editor.confirmDiscard}
        discardStayButtonRef={editor.discardStayButtonRef}
        saveAction={editor.saveAction}
        onCancel={editor.requestCancel}
        onStay={() => editor.setConfirmDiscard(false)}
        onDiscard={editor.discardAndLeave}
        onSave={editor.save}
      />

      <div className="skill-editor-workspace">
        <div className="skill-editor-pane skill-editor-pane-left">
          <SkillEditorMetadataPanel
            mode={mode}
            templates={editor.templates}
            pendingTemplate={editor.pendingTemplate}
            templateKeepButtonRef={editor.templateKeepButtonRef}
            activeValidationErrors={editor.activeValidationErrors}
            hasServerValidationErrors={editor.hasServerValidationErrors}
            setupChecks={editor.setupChecks}
            fieldsReady={editor.fieldsReady}
            saveAction={editor.saveAction}
            name={editor.name}
            nameError={editor.nameError}
            description={editor.description}
            descriptionError={editor.descriptionError}
            tagsInput={editor.tagsInput}
            tagsError={editor.tagsError}
            onRequestApplyTemplate={editor.requestApplyTemplate}
            onCancelPendingTemplate={() => editor.setPendingTemplate(null)}
            onConfirmApplyTemplate={editor.confirmApplyTemplate}
            onNameChange={editor.setName}
            onDescriptionChange={editor.setDescription}
            onTagsChange={editor.setTagsInput}
            onFieldTouched={editor.markFieldTouched}
          />

          <SkillEditorBodyPanel
            activeTab={tabs.activeTab}
            body={editor.body}
            bodyError={editor.bodyError}
            editTabButtonRef={tabs.editTabButtonRef}
            previewTabButtonRef={tabs.previewTabButtonRef}
            onTabChange={tabs.setActiveTab}
            onTabKeyDown={tabs.handleEditorTabKeyDown}
            onBodyChange={editor.setBody}
            onFieldTouched={editor.markFieldTouched}
          />
        </div>

        <SkillEditorLivePreview
          description={editor.description}
          tags={editor.parsedTags}
          body={editor.body}
          bodyError={editor.bodyError}
        />
      </div>
    </div>
  );
}
