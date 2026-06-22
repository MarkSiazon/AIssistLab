export interface SkillSummary {
  name: string;
  description: string;
  tags: string[];
  updatedAt: string;
}

export function filterSkills(
  skills: SkillSummary[] | null | undefined,
  search: string,
): SkillSummary[] {
  if (!skills) return [];
  const query = search.trim().toLowerCase();
  if (!query) return skills;

  return skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(query)),
  );
}

export function getSkillsEmptyStateCopy(hasSearch: boolean): {
  title: string;
  message: string;
} {
  return hasSearch
    ? {
        title: "No matching skills",
        message:
          "Clear the search or adjust the terms to see more of the local library.",
      }
    : {
        title: "No skills yet",
        message:
          "Start with the guided builder, create a blank skill, or preview an import before writing files.",
      };
}

function pluralSuffix(value: number): string {
  return value === 1 ? "" : "s";
}

export function buildIndexRebuiltMessage(input: {
  skillCount: number;
  chunkCount: number;
}): string {
  return `Index rebuilt with ${input.skillCount} skill${pluralSuffix(
    input.skillCount,
  )} and ${input.chunkCount} chunk${pluralSuffix(input.chunkCount)}.`;
}

export function buildImportAppliedMessage(input: {
  writtenCount: number;
  skippedCount: number;
  renamedCount: number;
}): string {
  return `Imported ${input.writtenCount} skill${pluralSuffix(
    input.writtenCount,
  )}${
    input.skippedCount > 0 ? `, skipped ${input.skippedCount}` : ""
  }${
    input.renamedCount > 0 ? `, renamed ${input.renamedCount}` : ""
  }. Index marked stale.`;
}
