"use client";

import type { RefObject } from "react";
import type { SkillEditorSaveAction } from "@/lib/ui/skill-editor-save-action";

interface SkillEditorHeaderProps {
  mode: "create" | "edit";
  name: string;
  error: string | null;
  saved: boolean;
  savedMessage: string;
  hasUnsavedChanges: boolean;
  confirmDiscard: boolean;
  discardStayButtonRef: RefObject<HTMLButtonElement>;
  saveAction: SkillEditorSaveAction;
  onCancel: () => void;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function SkillEditorHeader({
  mode,
  name,
  error,
  saved,
  savedMessage,
  hasUnsavedChanges,
  confirmDiscard,
  discardStayButtonRef,
  saveAction,
  onCancel,
  onStay,
  onDiscard,
  onSave,
}: SkillEditorHeaderProps) {
  return (
    <div className="skill-editor-header">
      <h1 className="skill-editor-title">
        {mode === "create" ? "New Skill" : `Edit: ${name}.md`}
      </h1>
      <div className="skill-editor-actions">
        {error && (
          <span
            className="skill-editor-status skill-editor-status-error"
            role="alert"
          >
            {error}
          </span>
        )}
        {saved && (
          <span
            className="skill-editor-status skill-editor-status-success"
            aria-live="polite"
          >
            {savedMessage}
          </span>
        )}
        {hasUnsavedChanges && !saved && (
          <span
            className="skill-editor-status skill-editor-status-warn"
            aria-live="polite"
          >
            Unsaved changes
          </span>
        )}
        {confirmDiscard ? (
          <div
            className="skill-editor-discard-confirm"
            role="alert"
            aria-label="Unsaved changes confirmation"
          >
            <span>Discard unsaved changes?</span>
            <button
              ref={discardStayButtonRef}
              type="button"
              onClick={onStay}
              className="ui-button ui-button-subtle"
            >
              Stay
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="ui-button ui-button-secondary skill-editor-discard-action"
            >
              Discard
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="ui-button ui-button-secondary"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!saveAction.canSave}
          aria-label={saveAction.ariaLabel}
          title={saveAction.helpText}
          className="ui-button ui-button-primary"
        >
          {saveAction.buttonLabel}
        </button>
      </div>
    </div>
  );
}
