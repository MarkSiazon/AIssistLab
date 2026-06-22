"use client";

interface SkillFrontmatterPreviewProps {
  description: string;
  tags: string[];
}

export function SkillFrontmatterPreview({
  description,
  tags,
}: SkillFrontmatterPreviewProps) {
  if (!description && tags.length === 0) return null;

  return (
    <div
      className="skill-editor-frontmatter"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
      }}
    >
      <div style={{ color: "var(--text-muted)" }}>---</div>
      {description && (
        <div>
          <span style={{ color: "var(--accent)" }}>description</span>
          <span style={{ color: "var(--text-muted)" }}>: </span>
          <span>{description}</span>
        </div>
      )}
      {tags.length > 0 && (
        <div>
          <span style={{ color: "var(--accent)" }}>tags</span>
          <span style={{ color: "var(--text-muted)" }}>
            : [{tags.join(", ")}]
          </span>
        </div>
      )}
      <div style={{ color: "var(--text-muted)" }}>---</div>
    </div>
  );
}
