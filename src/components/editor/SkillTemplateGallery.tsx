"use client";

import type { Ref } from "react";
import type { SkillTemplate } from "@/lib/ui/skill-editor-model";

interface SkillTemplateGalleryProps {
  templates: SkillTemplate[];
  pendingTemplate: SkillTemplate | null;
  keepButtonRef: Ref<HTMLButtonElement>;
  onRequestApply: (template: SkillTemplate) => void;
  onCancelPending: () => void;
  onConfirmApply: () => void;
}

export function SkillTemplateGallery({
  templates,
  pendingTemplate,
  keepButtonRef,
  onRequestApply,
  onCancelPending,
  onConfirmApply,
}: SkillTemplateGalleryProps) {
  if (templates.length === 0) return null;

  return (
    <section className="skill-editor-template-section">
      <div className="skill-editor-section-label">Template Gallery</div>
      {pendingTemplate && (
        <div
          className="skill-editor-template-confirm"
          role="alert"
          aria-label={`Confirm applying ${pendingTemplate.label} template`}
        >
          <div className="skill-editor-template-confirm-copy">
            <div className="skill-editor-template-confirm-title">
              Apply {pendingTemplate.label} template?
            </div>
            <div className="skill-editor-template-confirm-message">
              This replaces the description, tags, and markdown body. Your skill
              name stays as typed.
            </div>
          </div>
          <div className="skill-editor-template-confirm-actions">
            <button
              ref={keepButtonRef}
              type="button"
              onClick={onCancelPending}
              className="ui-button ui-button-subtle"
            >
              Keep draft
            </button>
            <button
              type="button"
              onClick={onConfirmApply}
              className="ui-button ui-button-secondary skill-editor-template-apply-action"
            >
              Apply template
            </button>
          </div>
        </div>
      )}
      <div className="skill-editor-template-grid">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onRequestApply(template)}
            className={`skill-editor-template-card${
              pendingTemplate?.id === template.id
                ? " skill-editor-template-card-pending"
                : ""
            }`}
            aria-label={`Use ${template.label} template`}
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-2)",
              color: "var(--text)",
            }}
          >
            <div className="skill-editor-template-title">{template.label}</div>
            <div
              className="skill-editor-template-description"
              style={{ color: "var(--text-muted)" }}
            >
              {template.description}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
