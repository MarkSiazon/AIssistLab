import {
  releaseStatusColor,
  releaseStatusLabel,
} from "./settings-status";

export interface SkillSummary {
  name: string;
  description: string;
  tags: string[];
  updatedAt: string;
}

export interface ReleaseReadinessResponse {
  summary: {
    status: "ready" | "needs_action" | "blocked";
    score: number;
    topAction: string | null;
    canChat?: boolean;
    canExportDiagnostics: boolean;
  };
  sections: Array<{
    id: string;
    label: string;
    status: "ready" | "needs_action" | "blocked";
    message: string;
    actionLabel?: string;
    actionHref?: string;
  }>;
}

export const diagnosticsContents = [
  "V1 readiness summary",
  "RAG index metadata",
  "Skill quality report",
  "Claude project inventory",
  "Sanitized settings summary",
];

export const diagnosticsPrivacyCopy =
  "Generated locally with sanitized readiness, index, quality, Claude project, and settings data. API keys, account identifiers, OAuth paths, and raw profile paths are not included.";

export function readinessLabel(
  status: ReleaseReadinessResponse["summary"]["status"],
) {
  return releaseStatusLabel(status);
}

export function readinessColor(
  status: ReleaseReadinessResponse["summary"]["status"],
) {
  return releaseStatusColor(status);
}

export function readinessCopy(
  summary: ReleaseReadinessResponse["summary"] | undefined,
  hasError: boolean,
) {
  if (summary) {
    return `Diagnostics export is ${
      summary.canExportDiagnostics ? "available" : "not available"
    }.`;
  }
  if (hasError) return "Diagnostics readiness is unavailable in this server mode.";
  return "Checking release readiness before export.";
}

export function buildExportReadinessMetrics(
  summary: ReleaseReadinessResponse["summary"] | undefined,
  hasError: boolean,
) {
  return [
    {
      label: "Readiness",
      value: summary ? readinessLabel(summary.status) : hasError ? "Unavailable" : "Checking",
    },
    {
      label: "Chat",
      value: summary
        ? summary.canChat
          ? "Ready"
          : "Blocked"
        : hasError
          ? "Unknown"
          : "Checking",
    },
    {
      label: "Diagnostics",
      value: summary
        ? summary.canExportDiagnostics
          ? "Available"
          : "Blocked"
        : hasError
          ? "Unknown"
          : "Checking",
    },
  ];
}

export function buildExportBundleStats(input: {
  skillCount: number;
  scopeLabel: string;
  includeDiagnostics: boolean;
  readinessSummary: ReleaseReadinessResponse["summary"] | undefined;
  readinessError: unknown;
}) {
  const readinessSummaryLabel = input.readinessSummary
    ? `${readinessLabel(input.readinessSummary.status)} - ${input.readinessSummary.score}/100`
    : input.readinessError
      ? "Unavailable"
      : "Checking";

  return [
    ["Available skills", input.skillCount.toString()],
    ["Bundle scope", input.scopeLabel],
    ["Diagnostics", input.includeDiagnostics ? "Included" : "Skills only"],
    ["Readiness", readinessSummaryLabel],
  ] as const;
}

export function buildExportReadinessStatus(input: {
  readinessSummary: ReleaseReadinessResponse["summary"] | undefined;
  readinessError: unknown;
}) {
  return {
    statusLabel: input.readinessSummary
      ? readinessLabel(input.readinessSummary.status)
      : input.readinessError
        ? "Unavailable"
        : "Checking",
    scoreLabel: input.readinessSummary
      ? `${input.readinessSummary.score}/100`
      : "--/100",
    statusColor: input.readinessSummary
      ? readinessColor(input.readinessSummary.status)
      : input.readinessError
        ? "var(--red)"
        : "var(--text-muted)",
  };
}

export function buildPrimaryDownloadLabel(input: {
  isLoading: boolean;
  skillCount: number;
  includeDiagnostics: boolean;
}) {
  if (input.isLoading) return "Preparing Export";
  if (input.skillCount === 0) return "Export Diagnostics";
  return input.includeDiagnostics
    ? "Download All + Diagnostics"
    : "Download All Skills";
}
