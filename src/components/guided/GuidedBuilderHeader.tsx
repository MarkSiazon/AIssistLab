"use client";

export function GuidedBuilderHeader() {
  return (
    <header className="guided-builder-header">
      <h1 className="guided-builder-title">Guided Skill Builder</h1>
      <div
        className="guided-builder-subtitle"
        style={{ color: "var(--text-muted)" }}
      >
        Create a deterministic skill draft, review the rubric, then save from the
        editor.
      </div>
    </header>
  );
}
