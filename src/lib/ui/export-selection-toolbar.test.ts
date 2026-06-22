import assert from "node:assert/strict";

async function main() {
  const toolbar = await import("./export-selection-toolbar");

  assert.deepEqual(
    toolbar.filterCurrentSelectedSkills({
      availableSkills: ["alpha", "beta", "gamma"],
      selectedSkills: new Set(["stale", "gamma", "alpha"]),
    }),
    ["alpha", "gamma"],
    "selected export names should be limited to current skills and preserve list order",
  );

  assert.deepEqual(
    toolbar.filterCurrentSelectedSkills({
      availableSkills: [],
      selectedSkills: new Set(["stale"]),
    }),
    [],
    "stale selections should not count as current export selections",
  );

  assert.deepEqual(
    toolbar.buildExportSelectionToolbarState({
      skillCount: 3,
      selectedCount: 0,
      includeDiagnostics: true,
    }),
    {
      selectionLabel: "0 of 3 selected",
      scopeLabel: "All skills",
      hint: "All-skill download includes every listed skill.",
      selectAllDisabled: false,
      clearDisabled: true,
      selectedDownloadDisabled: true,
      selectedDownloadLabel: "Select skills to download",
      selectedDownloadAriaLabel: "Select at least one skill before downloading a selected bundle",
    },
  );

  assert.deepEqual(
    toolbar.buildExportSelectionToolbarState({
      skillCount: 3,
      selectedCount: 2,
      includeDiagnostics: true,
    }),
    {
      selectionLabel: "2 of 3 selected",
      scopeLabel: "2 selected",
      hint: "Selected download uses only checked skills.",
      selectAllDisabled: false,
      clearDisabled: false,
      selectedDownloadDisabled: false,
      selectedDownloadLabel: "Download Selected + Diagnostics (2)",
      selectedDownloadAriaLabel: "Download 2 selected skills with diagnostics",
    },
  );

  assert.deepEqual(
    toolbar.buildExportSelectionToolbarState({
      skillCount: 3,
      selectedCount: 3,
      includeDiagnostics: false,
    }),
    {
      selectionLabel: "3 of 3 selected",
      scopeLabel: "3 selected",
      hint: "Selected download uses only checked skills.",
      selectAllDisabled: true,
      clearDisabled: false,
      selectedDownloadDisabled: false,
      selectedDownloadLabel: "Download Selected Skills (3)",
      selectedDownloadAriaLabel: "Download 3 selected skills without diagnostics",
    },
  );

  assert.deepEqual(
    toolbar.buildExportSelectionToolbarState({
      skillCount: 0,
      selectedCount: 0,
      includeDiagnostics: true,
    }),
    {
      selectionLabel: "No exportable skills",
      scopeLabel: "All skills",
      hint: "Create or import skills before selecting a bundle.",
      selectAllDisabled: true,
      clearDisabled: true,
      selectedDownloadDisabled: true,
      selectedDownloadLabel: "Select skills to download",
      selectedDownloadAriaLabel: "Create or import skills before downloading a selected bundle",
    },
  );

  console.log("Export selection toolbar tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
