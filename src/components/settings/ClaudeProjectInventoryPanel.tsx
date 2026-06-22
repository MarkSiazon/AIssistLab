import type { ReactNode } from "react";

import {
  getClaudeProjectInventoryPanelState,
  type ClaudeProjectDoctorCheck,
  type ClaudeProjectDoctorStatus,
  type ClaudeProjectInventory,
} from "@/lib/ui/claude-project-inventory-panel";

interface ClaudeProjectInventoryPanelProps {
  inventory: ClaudeProjectInventory | null;
  doctorChecks: ClaudeProjectDoctorCheck[];
  doctorLoading: boolean;
  statusColor: (status: ClaudeProjectDoctorStatus) => string;
  renderDoctorCheck: (
    item: ClaudeProjectDoctorCheck,
    options?: { showFix?: boolean; showEnvKeys?: boolean },
  ) => ReactNode;
}

function ProjectCount({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="rounded border px-2 py-1.5"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}

export function ClaudeProjectInventoryPanel({
  inventory,
  doctorChecks,
  doctorLoading,
  statusColor,
  renderDoctorCheck,
}: ClaudeProjectInventoryPanelProps) {
  const panelState = getClaudeProjectInventoryPanelState({
    inventory,
    doctorChecks,
  });

  return (
    <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
      <div
        className="text-xs font-medium mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        Claude Project Inventory
      </div>
      {inventory ? (
        <div className="flex flex-col gap-3">
          <div
            className="text-[10px] font-mono break-all"
            title={inventory.workspaceDisplay}
            style={{ color: "var(--text-muted)" }}
          >
            {inventory.workspaceDisplay}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {panelState.counts.map((item) => (
              <ProjectCount
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {panelState.highlightChecks.map((item) => (
              <div
                key={item.id}
                className="text-xs rounded border px-2 py-1.5"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                  lineHeight: 1.35,
                }}
              >
                <span
                  className="font-medium"
                  style={{ color: statusColor(item.status) }}
                >
                  {item.title}
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                  {`: ${item.message}`}
                </span>
              </div>
            ))}
          </div>
          {panelState.reloadHints.length > 0 && (
            <div className="flex flex-col gap-1">
              <div
                className="text-[10px] font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Reload hints
              </div>
              {panelState.reloadHints.map((hint) => (
                <div
                  key={hint}
                  className="text-xs"
                  style={{ color: "var(--yellow)", lineHeight: 1.35 }}
                >
                  {hint}
                </div>
              ))}
            </div>
          )}
          {panelState.actionChecks.map((item) =>
            renderDoctorCheck(item, {
              showFix: true,
              showEnvKeys: false,
            }),
          )}
        </div>
      ) : (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {doctorLoading ? "Loading..." : "Claude project inventory unavailable"}
        </div>
      )}
    </div>
  );
}
