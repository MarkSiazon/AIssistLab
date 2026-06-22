export type ExportEmptyLinkActionId = "guided-builder" | "skills-library";
export type ExportEmptyButtonActionId = "export-diagnostics";
export type ExportEmptyActionId =
  | ExportEmptyLinkActionId
  | ExportEmptyButtonActionId;

interface ExportEmptyActionBase {
  label: string;
  variant: "primary" | "secondary";
}

export interface ExportEmptyLinkAction extends ExportEmptyActionBase {
  id: ExportEmptyLinkActionId;
  href: string;
}

export interface ExportEmptyButtonAction extends ExportEmptyActionBase {
  id: ExportEmptyButtonActionId;
}

export type ExportEmptyAction = ExportEmptyLinkAction | ExportEmptyButtonAction;

export function buildExportEmptyActions({
  skillCount,
  diagnosticsActionVisible,
}: {
  skillCount: number;
  diagnosticsActionVisible: boolean;
}): ExportEmptyAction[] {
  if (skillCount > 0) return [];

  const actions: ExportEmptyAction[] = [
    {
      id: "guided-builder",
      label: "Guided Builder",
      href: "/editor/guided",
      variant: "primary",
    },
    {
      id: "skills-library",
      label: "Open Skills",
      href: "/skills",
      variant: "secondary",
    },
  ];

  if (!diagnosticsActionVisible) {
    actions.push({
      id: "export-diagnostics",
      label: "Export Diagnostics",
      variant: "secondary",
    });
  }

  return actions;
}
