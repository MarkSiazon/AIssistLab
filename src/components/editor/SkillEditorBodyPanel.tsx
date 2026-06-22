"use client";

import type { KeyboardEvent, RefObject } from "react";
import { SkillMarkdownPreview } from "@/components/editor/SkillMarkdownPreview";
import type { EditorTabId } from "@/lib/ui/editor-tab-navigation";
import type {
  SkillValidationError,
  SkillValidationField,
} from "@/lib/ui/skill-editor-model";

interface SkillEditorBodyPanelProps {
  activeTab: EditorTabId;
  body: string;
  bodyError?: SkillValidationError;
  editTabButtonRef: RefObject<HTMLButtonElement>;
  previewTabButtonRef: RefObject<HTMLButtonElement>;
  onTabChange: (tab: EditorTabId) => void;
  onTabKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onBodyChange: (body: string) => void;
  onFieldTouched: (field: SkillValidationField) => void;
}

export function SkillEditorBodyPanel({
  activeTab,
  body,
  bodyError,
  editTabButtonRef,
  previewTabButtonRef,
  onTabChange,
  onTabKeyDown,
  onBodyChange,
  onFieldTouched,
}: SkillEditorBodyPanelProps) {
  return (
    <div className="skill-editor-pane">
      <div
        className="skill-editor-tabbar"
        role="tablist"
        aria-label="Body editor view"
      >
        <button
          id="skill-editor-edit-tab"
          ref={editTabButtonRef}
          type="button"
          role="tab"
          aria-selected={activeTab === "edit"}
          aria-controls="skill-editor-edit-panel"
          tabIndex={activeTab === "edit" ? 0 : -1}
          onClick={() => onTabChange("edit")}
          onKeyDown={onTabKeyDown}
          className="skill-editor-tab"
        >
          Edit
        </button>
        <button
          id="skill-editor-preview-tab"
          ref={previewTabButtonRef}
          type="button"
          role="tab"
          aria-selected={activeTab === "preview"}
          aria-controls="skill-editor-preview-panel"
          tabIndex={activeTab === "preview" ? 0 : -1}
          onClick={() => onTabChange("preview")}
          onKeyDown={onTabKeyDown}
          className="skill-editor-tab"
        >
          Mobile Preview
        </button>
        <span id="skill-editor-body-help" className="skill-editor-body-help">
          Markdown skill body
        </span>
        <span className="skill-editor-line-count">
          {body.split("\n").length} lines
        </span>
      </div>
      {activeTab === "edit" ? (
        <div
          id="skill-editor-edit-panel"
          role="tabpanel"
          aria-labelledby="skill-editor-edit-tab"
          className="skill-editor-edit-panel"
        >
          <textarea
            aria-label="Skill markdown body"
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            onBlur={() => onFieldTouched("body")}
            className="skill-editor-body"
            aria-invalid={bodyError ? "true" : "false"}
            aria-describedby={`skill-editor-body-help${
              bodyError ? " skill-editor-body-error" : ""
            }`}
            spellCheck={false}
          />
          {bodyError && (
            <div
              id="skill-editor-body-error"
              className="skill-editor-body-error"
              role="alert"
            >
              {bodyError.message}
            </div>
          )}
        </div>
      ) : (
        <div
          id="skill-editor-preview-panel"
          role="tabpanel"
          aria-labelledby="skill-editor-preview-tab"
          className="skill-editor-preview-scroll"
        >
          <SkillMarkdownPreview body={body} />
        </div>
      )}
    </div>
  );
}
