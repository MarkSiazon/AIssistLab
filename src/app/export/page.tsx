"use client";

import { useState } from "react";
import useSWR from "swr";
import { ExportBundleSummary } from "@/components/export/ExportBundleSummary";
import { ExportEmptyState } from "@/components/export/ExportEmptyState";
import { ExportReadinessPanel } from "@/components/export/ExportReadinessPanel";
import { ExportSelectionToolbar } from "@/components/export/ExportSelectionToolbar";
import { ExportSkillList } from "@/components/export/ExportSkillList";
import { requestJson } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/routes/api-routes";
import { markDiagnosticsExportedThisSession } from "@/lib/ui/diagnostics-export-session";
import { buildExportEmptyActions } from "@/lib/ui/export-empty-state";
import { assignSafeInternalLocation } from "@/lib/ui/safe-navigation";
import {
  buildExportBundleStats,
  buildPrimaryDownloadLabel,
  type ReleaseReadinessResponse,
  type SkillSummary,
} from "@/lib/ui/export-page-model";
import { skillExportHref, skillsZipExportHref } from "@/lib/ui/skill-action-links";
import {
  buildExportSelectionToolbarState,
  filterCurrentSelectedSkills,
} from "@/lib/ui/export-selection-toolbar";

const fetchSkills = (url: string) =>
  requestJson<{ skills: SkillSummary[] }>(url, undefined, "Request failed");

const fetchReadiness = (url: string) =>
  requestJson<ReleaseReadinessResponse>(url, undefined, "Request failed");

export default function ExportPage() {
  const { data, isLoading } = useSWR<{ skills: SkillSummary[] }>(
    API_ROUTES.skills,
    fetchSkills,
  );
  const { data: readiness, error: readinessError } =
    useSWR<ReleaseReadinessResponse>(
      API_ROUTES.releaseReadiness,
      fetchReadiness,
    );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const skills = data?.skills ?? [];
  const currentSelectedSkills = filterCurrentSelectedSkills({
    availableSkills: skills.map((skill) => skill.name),
    selectedSkills: selected,
  });
  const selectedCount = currentSelectedSkills.length;
  const selectionToolbar = buildExportSelectionToolbarState({
    skillCount: skills.length,
    selectedCount,
    includeDiagnostics,
  });
  const primaryDownloadLabel = buildPrimaryDownloadLabel({
    isLoading,
    skillCount: skills.length,
    includeDiagnostics,
  });
  const bundleStats = buildExportBundleStats({
    skillCount: skills.length,
    scopeLabel: selectionToolbar.scopeLabel,
    includeDiagnostics,
    readinessSummary: readiness?.summary,
    readinessError,
  });
  const emptyActions = buildExportEmptyActions({
    skillCount: skills.length,
    diagnosticsActionVisible: true,
  });

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(skills.map((skill) => skill.name)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function downloadSkill(name: string) {
    assignSafeInternalLocation(window.location, skillExportHref(name));
  }

  function downloadZip(selectedOnly = false, diagnostics = includeDiagnostics) {
    if (selectedOnly && currentSelectedSkills.length === 0) return;

    if (diagnostics) {
      markDiagnosticsExportedThisSession();
    }
    assignSafeInternalLocation(
      window.location,
      skillsZipExportHref({
        selectedSkills: selectedOnly ? currentSelectedSkills : [],
        includeDiagnostics: diagnostics,
      }),
    );
  }

  function downloadDiagnosticsBundle() {
    downloadZip(false, true);
  }

  return (
    <div className="export-shell">
      <header className="export-header">
        <div className="export-header-copy">
          <h1 className="export-title">Export Skills</h1>
          <p className="export-subtitle">
            Download skill files individually or bundle them with sanitized
            diagnostics for local review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadZip(false)}
          disabled={isLoading}
          className="ui-button ui-button-primary export-primary-action"
        >
          {primaryDownloadLabel}
        </button>
      </header>

      <section className="export-content" aria-label="Export workspace">
        <ExportReadinessPanel
          readiness={readiness}
          readinessError={readinessError}
          onExportDiagnostics={downloadDiagnosticsBundle}
        />

        <ExportBundleSummary stats={bundleStats} />

        {isLoading ? (
          <div
            className="ui-panel export-loading"
            role="status"
            aria-live="polite"
            style={{ color: "var(--text-muted)" }}
          >
            Loading exportable skills...
          </div>
        ) : skills.length === 0 ? (
          <ExportEmptyState
            actions={emptyActions}
            onExportDiagnostics={downloadDiagnosticsBundle}
          />
        ) : (
          <>
            <ExportSelectionToolbar
              selectedCount={selectedCount}
              skillCount={skills.length}
              includeDiagnostics={includeDiagnostics}
              toolbar={selectionToolbar}
              onIncludeDiagnosticsChange={setIncludeDiagnostics}
              onSelectAll={selectAll}
              onSelectNone={selectNone}
              onDownloadSelected={() => downloadZip(true)}
            />

            <ExportSkillList
              skills={skills}
              selected={selected}
              onToggle={toggle}
              onDownloadSkill={downloadSkill}
            />

            <section className="ui-panel export-usage" aria-label="After export">
              <div className="export-section-label">After export</div>
              <div
                className="export-command-block"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                <div># Place exported .md files in any Claude Code workspace:</div>
                <div style={{ color: "var(--text)" }}>
                  mkdir -p .claude/skills
                </div>
                <div style={{ color: "var(--text)" }}>
                  cp *.md .claude/skills/
                </div>
                <div className="mt-2"># Then invoke in Claude Code sessions:</div>
                <div style={{ color: "var(--text)" }}>
                  /skill-name [optional arguments]
                </div>
              </div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}
