"use client";

import type { RefObject } from "react";
import { SkillSetupChecklist } from "@/components/editor/SkillSetupChecklist";
import { SkillTemplateGallery } from "@/components/editor/SkillTemplateGallery";
import { SkillValidationAlert } from "@/components/editor/SkillValidationAlert";
import type {
  SkillEditorSetupCheck,
  SkillTemplate,
  SkillValidationError,
  SkillValidationField,
} from "@/lib/ui/skill-editor-model";
import type { SkillEditorSaveAction } from "@/lib/ui/skill-editor-save-action";

interface SkillEditorMetadataPanelProps {
  mode: "create" | "edit";
  templates: SkillTemplate[];
  pendingTemplate: SkillTemplate | null;
  templateKeepButtonRef: RefObject<HTMLButtonElement>;
  activeValidationErrors: SkillValidationError[];
  hasServerValidationErrors: boolean;
  setupChecks: SkillEditorSetupCheck[];
  fieldsReady: boolean;
  saveAction: SkillEditorSaveAction;
  name: string;
  nameError?: SkillValidationError;
  description: string;
  descriptionError?: SkillValidationError;
  tagsInput: string;
  tagsError?: SkillValidationError;
  onRequestApplyTemplate: (template: SkillTemplate) => void;
  onCancelPendingTemplate: () => void;
  onConfirmApplyTemplate: () => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onFieldTouched: (field: SkillValidationField) => void;
}

function normalizeSkillName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

interface SkillEditorTextFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  help: string;
  error?: SkillValidationError;
  disabled?: boolean;
  mutedWhenDisabled?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function SkillEditorTextField({
  id,
  label,
  value,
  placeholder,
  help,
  error,
  disabled = false,
  mutedWhenDisabled = false,
  onChange,
  onBlur,
}: SkillEditorTextFieldProps) {
  return (
    <div className="skill-editor-field">
      <label htmlFor={id} className="skill-editor-field-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        className="skill-editor-input"
        aria-invalid={error ? "true" : "false"}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
        style={{
          background: "var(--surface-2)",
          borderColor: error ? "var(--yellow)" : "var(--border)",
          color: disabled && mutedWhenDisabled ? "var(--text-muted)" : "var(--text)",
        }}
      />
      <div
        id={`${id}-help`}
        className="skill-editor-help"
        style={{ color: "var(--text-muted)" }}
      >
        {help}
      </div>
      {error && (
        <div id={`${id}-error`} className="skill-editor-field-error">
          {error.message}
        </div>
      )}
    </div>
  );
}

export function SkillEditorMetadataPanel({
  mode,
  templates,
  pendingTemplate,
  templateKeepButtonRef,
  activeValidationErrors,
  hasServerValidationErrors,
  setupChecks,
  fieldsReady,
  saveAction,
  name,
  nameError,
  description,
  descriptionError,
  tagsInput,
  tagsError,
  onRequestApplyTemplate,
  onCancelPendingTemplate,
  onConfirmApplyTemplate,
  onNameChange,
  onDescriptionChange,
  onTagsChange,
  onFieldTouched,
}: SkillEditorMetadataPanelProps) {
  return (
    <div className="skill-editor-metadata">
      <div className="skill-editor-metadata-stack">
        {mode === "create" && (
          <SkillTemplateGallery
            templates={templates}
            pendingTemplate={pendingTemplate}
            keepButtonRef={templateKeepButtonRef}
            onRequestApply={onRequestApplyTemplate}
            onCancelPending={onCancelPendingTemplate}
            onConfirmApply={onConfirmApplyTemplate}
          />
        )}
        <SkillValidationAlert
          errors={activeValidationErrors}
          hasServerErrors={hasServerValidationErrors}
        />
        <SkillSetupChecklist
          checks={setupChecks}
          fieldsReady={fieldsReady}
          statusLabel={saveAction.statusLabel}
        />
        <SkillEditorTextField
          id="skill-editor-name"
          label="Skill name (lowercase, hyphens only)"
          value={name}
          placeholder="my-skill-name"
          help="Used as the local file and route name."
          error={nameError}
          disabled={mode === "edit"}
          mutedWhenDisabled
          onChange={(value) => onNameChange(normalizeSkillName(value))}
          onBlur={() => onFieldTouched("name")}
        />
        <SkillEditorTextField
          id="skill-editor-description"
          label="Description"
          value={description}
          placeholder="What does this skill do?"
          help="Keep this invocation-focused so Claude can decide when to use it."
          error={descriptionError}
          onChange={onDescriptionChange}
          onBlur={() => onFieldTouched("description")}
        />
        <SkillEditorTextField
          id="skill-editor-tags"
          label="Tags (comma-separated)"
          value={tagsInput}
          placeholder="git, pr, review"
          help="Separate tags with commas. Duplicate tags block saving."
          error={tagsError}
          onChange={onTagsChange}
          onBlur={() => onFieldTouched("tags")}
        />
      </div>
    </div>
  );
}
