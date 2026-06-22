"use client";

import type { SkillEditorSetupCheck } from "@/lib/ui/skill-editor-model";

interface SkillSetupChecklistProps {
  checks: SkillEditorSetupCheck[];
  fieldsReady: boolean;
  statusLabel: string;
}

export function SkillSetupChecklist({
  checks,
  fieldsReady,
  statusLabel,
}: SkillSetupChecklistProps) {
  return (
    <section className="skill-editor-setup-panel" aria-label="Skill setup checklist">
      <div className="skill-editor-setup-header">
        <div>
          <div className="skill-editor-section-label">Skill setup</div>
          <div className="skill-editor-setup-copy">
            Save is enabled when required items are ready and changed.
          </div>
        </div>
        <span
          className={`skill-editor-setup-status ${
            fieldsReady
              ? "skill-editor-setup-status-ready"
              : "skill-editor-setup-status-needed"
          }`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="skill-editor-setup-grid">
        {checks.map((item) => (
          <div
            key={item.id}
            className={`skill-editor-setup-item ${
              item.ready
                ? "skill-editor-setup-item-ready"
                : "skill-editor-setup-item-needed"
            }`}
          >
            <div className="skill-editor-setup-item-head">
              <span className="skill-editor-setup-dot" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
            <div className="skill-editor-setup-item-message">
              {item.ready ? "Ready" : "Needs action"}: {item.message}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
