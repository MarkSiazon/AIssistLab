"use client";

import type { SkillValidationError } from "@/lib/ui/skill-editor-model";

interface SkillValidationAlertProps {
  errors: SkillValidationError[];
  hasServerErrors: boolean;
}

export function SkillValidationAlert({
  errors,
  hasServerErrors,
}: SkillValidationAlertProps) {
  if (errors.length === 0) return null;

  return (
    <div
      className="skill-editor-validation-alert"
      role={hasServerErrors ? "alert" : "status"}
      style={{
        borderColor: "var(--yellow)",
        background: "var(--surface)",
      }}
    >
      <div
        className="skill-editor-validation-title"
        style={{ color: "var(--yellow)" }}
      >
        Fix before saving
      </div>
      <div className="skill-editor-validation-list">
        {errors.map((item) => (
          <div
            key={`${item.field}-${item.code}`}
            className="skill-editor-validation-item"
            style={{ color: "var(--text-muted)" }}
          >
            {item.message}
          </div>
        ))}
      </div>
    </div>
  );
}
