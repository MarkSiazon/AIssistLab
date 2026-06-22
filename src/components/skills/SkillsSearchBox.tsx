"use client";

interface SkillsSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SkillsSearchBox({ value, onChange }: SkillsSearchBoxProps) {
  return (
    <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
      <label htmlFor="skills-search" className="skills-form-label">
        Search skills
      </label>
      <input
        id="skills-search"
        type="text"
        placeholder="Search skills..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby="skills-search-help"
        className="w-full text-sm px-3 py-1.5 rounded border outline-none"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      />
      <div id="skills-search-help" className="skills-form-help">
        Filter by skill name, description, or tag.
      </div>
    </div>
  );
}
