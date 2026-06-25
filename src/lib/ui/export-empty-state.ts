import { APP_ROUTES } from "@/lib/routes/app-routes";

type ExportEmptyLinkActionId = "guided-builder" | "skills-library";
type ExportEmptyButtonActionId = "export-diagnostics";

interface ExportEmptyActionBase {
  label: string;
  variant: "primary" | "secondary";
}

interface ExportEmptyLinkAction extends ExportEmptyActionBase {
  id: ExportEmptyLinkActionId;
  href: string;
}

interface ExportEmptyButtonAction extends ExportEmptyActionBase {
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
      href: APP_ROUTES.guidedBuilder,
      variant: "primary",
    },
    {
      id: "skills-library",
      label: "Open Skills",
      href: APP_ROUTES.skills,
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
