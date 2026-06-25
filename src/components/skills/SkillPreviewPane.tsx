"use client";

import type { Ref } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EmptyStateIcon } from "@/components/ui/EmptyStateIcon";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import { isManagedSkillName } from "@/lib/skills/name";
import { skillEditorHref, skillExportHref } from "@/lib/ui/skill-action-links";
import type { SkillDeleteActionState } from "@/lib/ui/skill-delete-action";

interface SkillPreviewPaneProps {
  selectedName: string | null;
  preview: string | null;
  previewLoading: boolean;
  deleteConfirm: string | null;
  deleteTypedName: string;
  deleteLoading: boolean;
  deleteAction: SkillDeleteActionState | null;
  deleteInputRef: Ref<HTMLInputElement>;
  onDeleteTypedNameChange: (value: string) => void;
  onRequestDelete: (name: string) => void;
  onConfirmDelete: (name: string) => void;
  onCancelDelete: () => void;
}

const EMPTY_WORKFLOW_STEPS = [
  ["1", "Create or import", "Start with Guided Builder, New Skill, or Import Preview."],
  ["2", "Rebuild index", "Refresh citations after skill files change."],
  ["3", "Chat or export", "Ask questions with sources or export a diagnostics bundle."],
] as const;

export function SkillPreviewPane({
  selectedName,
  preview,
  previewLoading,
  deleteConfirm,
  deleteTypedName,
  deleteLoading,
  deleteAction,
  deleteInputRef,
  onDeleteTypedNameChange,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: SkillPreviewPaneProps) {
  const canManageSelectedSkill = selectedName
    ? isManagedSkillName(selectedName)
    : false;

  return (
    <div className="skills-preview-pane">
      {selectedName ? (
        <>
          <div
            className="skills-preview-toolbar border-b"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          >
            <span className="text-sm font-semibold break-all">
              {selectedName}.md
            </span>
            <div className="skills-preview-actions">
              {canManageSelectedSkill ? (
                <Link
                  href={skillEditorHref(selectedName)}
                  className="ui-button ui-button-secondary text-xs"
                >
                  Edit
                </Link>
              ) : null}
              <a
                href={skillExportHref(selectedName)}
                className="ui-button ui-button-secondary text-xs"
              >
                Export .md
              </a>
              {!canManageSelectedSkill ? (
                <span className="skills-form-help">
                  Read-only: rename this file to lowercase letters, numbers, and
                  hyphens to edit or delete it here.
                </span>
              ) : deleteConfirm === selectedName && deleteAction ? (
                <div className="skills-delete-confirm">
                  <label
                    htmlFor="skills-delete-confirm"
                    className="skills-delete-confirm-field"
                  >
                    <span className="skills-form-label">
                      Type skill name to delete
                    </span>
                    <input
                      id="skills-delete-confirm"
                      ref={deleteInputRef}
                      value={deleteTypedName}
                      onChange={(event) =>
                        onDeleteTypedNameChange(event.target.value)
                      }
                      placeholder={`Type ${selectedName}`}
                      aria-describedby={`skills-delete-confirm-help${
                        deleteAction.blocker
                          ? " skills-delete-confirm-blocker"
                          : ""
                      }`}
                      className="text-xs px-2 py-1.5 rounded border outline-none"
                      style={{
                        background: "var(--surface-2)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                        minHeight: "44px",
                      }}
                    />
                    <span id="skills-delete-confirm-help" className="skills-form-help">
                      Deletes {selectedName}.md to a local backup and marks the
                      index stale.
                    </span>
                    {deleteAction.blocker && (
                      <span
                        id="skills-delete-confirm-blocker"
                        className="skills-delete-blocker"
                        role="status"
                        aria-live="polite"
                      >
                        {deleteAction.blocker}
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => onConfirmDelete(selectedName)}
                    disabled={!deleteAction.canDelete}
                    aria-label={deleteAction.ariaLabel}
                    aria-describedby={
                      deleteAction.blocker
                        ? "skills-delete-confirm-blocker"
                        : undefined
                    }
                    className="ui-button text-xs"
                    style={{
                      background: deleteAction.canDelete
                        ? "var(--red)"
                        : "var(--surface-2)",
                      color: deleteAction.canDelete ? "#fff" : "var(--text-muted)",
                      cursor: deleteAction.canDelete ? "pointer" : "not-allowed",
                      minHeight: "44px",
                    }}
                  >
                    {deleteAction.buttonLabel}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelDelete}
                    disabled={deleteLoading}
                    className="ui-button ui-button-subtle text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onRequestDelete(selectedName)}
                  className="ui-button ui-button-secondary text-xs"
                  style={{ borderColor: "var(--red)", color: "var(--red)" }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="skills-preview-scroll">
            {previewLoading ? (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                Loading...
              </div>
            ) : preview !== null ? (
              <div className="prose max-w-3xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {preview}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="skills-preview-empty">
          <EmptyStateIcon name="skills" label="Skills" />
          <div>
            <div className="skills-preview-empty-title">
              Select a skill to preview
            </div>
            <div className="skills-preview-empty-copy">
              Build a skill library, rebuild the index, then use Chat and Export
              with clearer citations and diagnostics.
            </div>
          </div>
          <div className="skills-preview-empty-steps" aria-label="Skill workflow">
            {EMPTY_WORKFLOW_STEPS.map(([step, title, copy]) => (
              <div key={step} className="skills-preview-empty-step">
                <span className="skills-preview-empty-step-index">{step}</span>
                <span className="skills-preview-empty-step-copy">
                  <span>{title}</span>
                  <span>{copy}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="skills-preview-empty-actions">
            <Link
              href={APP_ROUTES.guidedBuilder}
              className="ui-button ui-button-primary text-sm"
            >
              Guided Builder
            </Link>
            <Link
              href={APP_ROUTES.editor}
              className="ui-button ui-button-secondary text-sm"
            >
              New Skill
            </Link>
            <a
              href="#skills-import-panel"
              className="ui-button ui-button-secondary text-sm"
            >
              Import Skills
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
