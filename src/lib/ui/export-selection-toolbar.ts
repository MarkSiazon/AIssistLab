export interface ExportSelectionToolbarInput {
  skillCount: number;
  selectedCount: number;
  includeDiagnostics: boolean;
}

export interface ExportSelectionToolbarState {
  selectionLabel: string;
  scopeLabel: string;
  hint: string;
  selectAllDisabled: boolean;
  clearDisabled: boolean;
  selectedDownloadDisabled: boolean;
  selectedDownloadLabel: string;
  selectedDownloadAriaLabel: string;
}

export function filterCurrentSelectedSkills({
  availableSkills,
  selectedSkills,
}: {
  availableSkills: Iterable<string>;
  selectedSkills: Iterable<string>;
}): string[] {
  const selected = new Set(selectedSkills);
  return Array.from(availableSkills).filter((skillName) =>
    selected.has(skillName),
  );
}

export function buildExportSelectionToolbarState({
  skillCount,
  selectedCount,
  includeDiagnostics,
}: ExportSelectionToolbarInput): ExportSelectionToolbarState {
  const boundedSkillCount = Math.max(0, skillCount);
  const boundedSelectedCount = Math.min(
    Math.max(0, selectedCount),
    boundedSkillCount,
  );
  const hasSkills = boundedSkillCount > 0;
  const hasSelection = boundedSelectedCount > 0;
  const allSelected = hasSkills && boundedSelectedCount === boundedSkillCount;
  const selectedDownloadDescriptor = includeDiagnostics ? " + Diagnostics" : " Skills";
  const diagnosticsAria = includeDiagnostics ? "with diagnostics" : "without diagnostics";

  if (!hasSkills) {
    return {
      selectionLabel: "No exportable skills",
      scopeLabel: "All skills",
      hint: "Create or import skills before selecting a bundle.",
      selectAllDisabled: true,
      clearDisabled: true,
      selectedDownloadDisabled: true,
      selectedDownloadLabel: "Select skills to download",
      selectedDownloadAriaLabel:
        "Create or import skills before downloading a selected bundle",
    };
  }

  return {
    selectionLabel: `${boundedSelectedCount} of ${boundedSkillCount} selected`,
    scopeLabel: hasSelection ? `${boundedSelectedCount} selected` : "All skills",
    hint: hasSelection
      ? "Selected download uses only checked skills."
      : "All-skill download includes every listed skill.",
    selectAllDisabled: allSelected,
    clearDisabled: !hasSelection,
    selectedDownloadDisabled: !hasSelection,
    selectedDownloadLabel: hasSelection
      ? `Download Selected${selectedDownloadDescriptor} (${boundedSelectedCount})`
      : "Select skills to download",
    selectedDownloadAriaLabel: hasSelection
      ? `Download ${boundedSelectedCount} selected skills ${diagnosticsAria}`
      : "Select at least one skill before downloading a selected bundle",
  };
}
