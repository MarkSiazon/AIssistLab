export type ManualExternalQaStatus = "pending" | "passed" | "failed" | "skipped";

export interface ManualExternalQaItemDefinition {
  id: string;
  label: string;
  action: string;
  passCriteria: string;
  manualReason: string;
}

export interface ManualExternalQaEvidenceItem
  extends ManualExternalQaItemDefinition {
  status: ManualExternalQaStatus;
  checkedAt: string | null;
}

export type ManualExternalQaEvidence = ManualExternalQaEvidenceItem[];

export interface ManualExternalQaStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ManualExternalQaStorageReadResult {
  evidence: ManualExternalQaEvidence;
  available: boolean;
}

export interface ManualExternalQaSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  statusLabel: "Complete" | "Needs review" | "Not complete";
}

const manualExternalQaStorageKey =
  "skill-workshop-manual-external-qa-evidence";

export const manualExternalQaCommand = "npm run qa:manual";

export const manualExternalQaItems: ManualExternalQaItemDefinition[] = [
  {
    id: "native-folder-picker",
    label: "Native folder picker",
    action: "Open Settings, click Choose folder, then cancel and select a harmless test folder.",
    passCriteria: "Visible OS picker opens, cancel is non-destructive, and selected folders update only the intended field.",
    manualReason: "The OS folder picker is a native device dialog and must be visually confirmed by the local user.",
  },
  {
    id: "claude-open-login",
    label: "Claude Open Login",
    action: "Select the intended Claude profile, click Open Login, then close or cancel the visible auth flow.",
    passCriteria: "Login never runs silently, the launcher is visible, and Settings stays sanitized.",
    manualReason: "The login action can open a private account-owned Claude auth flow, so automation must not click it.",
  },
  {
    id: "account-backed-chat",
    label: "Account-backed chat",
    action: "Use an allowed API key or Claude profile, send the release-readiness prompt, and inspect the cited answer.",
    passCriteria: "Chat sends only after user action, provider failures are actionable, and no account/auth details leak.",
    manualReason: "A real chat sends a user-owned prompt through configured credentials and needs account approval.",
  },
];

export function createManualExternalQaEvidence(
  savedItems: Partial<ManualExternalQaEvidenceItem>[] = [],
): ManualExternalQaEvidence {
  const byId = new Map(savedItems.map((item) => [item.id, item]));

  return manualExternalQaItems.map((definition) => {
    const saved = byId.get(definition.id);
    const status =
      saved?.status === "passed" ||
      saved?.status === "failed" ||
      saved?.status === "skipped"
        ? saved.status
        : "pending";
    const checkedAt =
      typeof saved?.checkedAt === "string" && saved.checkedAt.trim()
        ? saved.checkedAt
        : null;

    return {
      ...definition,
      status,
      checkedAt: status === "pending" ? null : checkedAt,
    };
  });
}

export function updateManualExternalQaEvidence(
  evidence: ManualExternalQaEvidence,
  itemId: string,
  status: ManualExternalQaStatus,
  nowIso: string,
): ManualExternalQaEvidence {
  return evidence.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status,
          checkedAt: status === "pending" ? null : nowIso,
        }
      : item,
  );
}

export function summarizeManualExternalQaEvidence(
  evidence: ManualExternalQaEvidence,
): ManualExternalQaSummary {
  const passed = evidence.filter((item) => item.status === "passed").length;
  const failed = evidence.filter((item) => item.status === "failed").length;
  const skipped = evidence.filter((item) => item.status === "skipped").length;
  const pending = evidence.filter((item) => item.status === "pending").length;

  return {
    total: evidence.length,
    passed,
    failed,
    skipped,
    pending,
    statusLabel:
      failed > 0
        ? "Needs review"
        : passed === evidence.length
          ? "Complete"
          : "Not complete",
  };
}

export function parseManualExternalQaEvidence(value: string | null): ManualExternalQaEvidence {
  if (!value) return createManualExternalQaEvidence();
  try {
    const parsed = JSON.parse(value) as unknown;
    return createManualExternalQaEvidence(Array.isArray(parsed) ? parsed : []);
  } catch {
    return createManualExternalQaEvidence();
  }
}

export function serializeManualExternalQaEvidence(
  evidence: ManualExternalQaEvidence,
): string {
  return JSON.stringify(
    evidence.map((item) => ({
      id: item.id,
      status: item.status,
      checkedAt: item.checkedAt,
    })),
  );
}

export function readManualExternalQaEvidenceFromStorage(
  storage: ManualExternalQaStorage,
): ManualExternalQaStorageReadResult {
  try {
    return {
      evidence: parseManualExternalQaEvidence(
        storage.getItem(manualExternalQaStorageKey),
      ),
      available: true,
    };
  } catch {
    return {
      evidence: createManualExternalQaEvidence(),
      available: false,
    };
  }
}

export function writeManualExternalQaEvidenceToStorage(
  storage: ManualExternalQaStorage,
  evidence: ManualExternalQaEvidence,
): boolean {
  try {
    storage.setItem(
      manualExternalQaStorageKey,
      serializeManualExternalQaEvidence(evidence),
    );
    return true;
  } catch {
    return false;
  }
}

export function manualExternalQaStatusLabel(
  status: ManualExternalQaStatus,
): "Pending" | "Passed" | "Needs fix" | "Skipped" {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Needs fix";
  if (status === "skipped") return "Skipped";
  return "Pending";
}

export function manualExternalQaStatusClassName(
  status: ManualExternalQaStatus,
): string {
  if (status === "passed") return "settings-manual-qa-status-passed";
  if (status === "failed") return "settings-manual-qa-status-failed";
  if (status === "skipped") return "settings-manual-qa-status-skipped";
  return "settings-manual-qa-status-pending";
}

export function formatManualExternalQaTimestamp(value: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
