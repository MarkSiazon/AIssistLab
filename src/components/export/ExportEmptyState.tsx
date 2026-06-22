import Link from "next/link";
import { EmptyStateIcon } from "@/components/ui/EmptyStateIcon";
import type { ExportEmptyAction } from "@/lib/ui/export-empty-state";
import { isSafeInternalActionHref } from "@/lib/ui/internal-action-href";

interface ExportEmptyStateProps {
  actions: ExportEmptyAction[];
  onExportDiagnostics: () => void;
}

export function ExportEmptyState({
  actions,
  onExportDiagnostics,
}: ExportEmptyStateProps) {
  return (
    <section
      className="ui-panel ui-empty-state export-empty"
      aria-label="No skills available to export"
    >
      <EmptyStateIcon name="export" label="No exportable skills" />
      <div>
        <div className="text-sm font-semibold">No skills are ready to export</div>
        <div
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Create or import skills first, then return here to export a skill
          bundle. Local diagnostics are still available from the page header and
          readiness panel.
        </div>
      </div>
      <div className="export-empty-actions">
        {actions.map((action) => {
          const className =
            action.variant === "primary"
              ? "ui-button ui-button-primary"
              : "ui-button ui-button-secondary";

          if (action.id === "export-diagnostics") {
            return (
              <button
                key={action.id}
                type="button"
                onClick={onExportDiagnostics}
                className={className}
                aria-label="Download diagnostics bundle with sanitized local readiness data"
              >
                {action.label}
              </button>
            );
          }

          if (!isSafeInternalActionHref(action.href)) return null;

          return (
            <Link key={action.id} href={action.href} className={className}>
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
