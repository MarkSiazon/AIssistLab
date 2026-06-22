"use client";

import type { GuidedValidationError } from "@/lib/ui/guided-builder-model";

export function GuidedValidationAlert({
  errors,
}: {
  errors: GuidedValidationError[];
}) {
  if (errors.length === 0) return null;

  return (
    <div
      className="guided-alert guided-alert-warning"
      role="alert"
      style={{ borderColor: "var(--yellow)", background: "var(--surface)" }}
    >
      <div className="guided-alert-title" style={{ color: "var(--yellow)" }}>
        Needs more detail
      </div>
      <div className="guided-alert-list">
        {errors.map((error) => (
          <div
            key={`${error.field}-${error.message}`}
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {error.message}
          </div>
        ))}
      </div>
    </div>
  );
}
