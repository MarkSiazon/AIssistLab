import type { SkillSummary } from "@/lib/ui/export-page-model";

interface ExportSkillListProps {
  skills: SkillSummary[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onDownloadSkill: (name: string) => void;
}

export function ExportSkillList({
  skills,
  selected,
  onToggle,
  onDownloadSkill,
}: ExportSkillListProps) {
  return (
    <div className="export-skill-list" aria-label="Exportable skills">
      {skills.map((skill) => (
        <article
          key={skill.name}
          className="ui-panel export-skill-row"
          style={{
            borderColor: selected.has(skill.name)
              ? "var(--accent)"
              : "var(--border)",
          }}
        >
          <label className="export-skill-select">
            <input
              type="checkbox"
              checked={selected.has(skill.name)}
              onChange={() => onToggle(skill.name)}
              className="export-checkbox export-skill-checkbox"
              aria-label={`Select ${skill.name} for export`}
            />
            <span className="export-skill-copy">
              <span className="export-skill-name">{skill.name}.md</span>
              <span
                className="export-skill-description"
                style={{ color: "var(--text-muted)" }}
              >
                {skill.description || "No description provided"}
              </span>
            </span>
          </label>
          <div className="export-skill-meta">
            <div
              className="export-skill-date"
              style={{ color: "var(--text-muted)" }}
            >
              {new Date(skill.updatedAt).toLocaleDateString()}
            </div>
            <button
              type="button"
              onClick={() => onDownloadSkill(skill.name)}
              className="ui-button ui-button-secondary text-xs"
              aria-label={`Download ${skill.name} as Markdown`}
            >
              Download .md
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
