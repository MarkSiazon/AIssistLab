"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserLocalStorage } from "@/lib/ui/browser-storage";
import {
  createManualExternalQaEvidence,
  formatManualExternalQaTimestamp,
  manualExternalQaCommand,
  manualExternalQaItems,
  manualExternalQaStatusLabel,
  readManualExternalQaEvidenceFromStorage,
  summarizeManualExternalQaEvidence,
  updateManualExternalQaEvidence,
  writeManualExternalQaEvidenceToStorage,
  type ManualExternalQaEvidence,
  type ManualExternalQaStatus,
} from "@/lib/ui/manual-external-qa-panel";

function statusClassName(status: ManualExternalQaStatus): string {
  if (status === "passed") return "settings-manual-qa-status-passed";
  if (status === "failed") return "settings-manual-qa-status-failed";
  return "settings-manual-qa-status-pending";
}

export function ManualExternalQaPanel() {
  const [evidence, setEvidence] = useState<ManualExternalQaEvidence>(() =>
    createManualExternalQaEvidence(),
  );
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const storage = getBrowserLocalStorage();
    if (!storage) {
      setEvidence(createManualExternalQaEvidence());
      setStorageAvailable(false);
      setHydrated(true);
      return;
    }

    const result = readManualExternalQaEvidenceFromStorage(storage);
    setEvidence(result.evidence);
    setStorageAvailable(result.available);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!storageAvailable) return;
    const storage = getBrowserLocalStorage();
    setStorageAvailable(
      storage
        ? writeManualExternalQaEvidenceToStorage(storage, evidence)
        : false,
    );
  }, [evidence, hydrated, storageAvailable]);

  const summary = useMemo(
    () => summarizeManualExternalQaEvidence(evidence),
    [evidence],
  );

  function updateStatus(itemId: string, status: ManualExternalQaStatus) {
    setEvidence((current) =>
      updateManualExternalQaEvidence(
        current,
        itemId,
        status,
        new Date().toISOString(),
      ),
    );
  }

  return (
    <section
      className="settings-manual-qa-panel"
      aria-labelledby="settings-manual-qa-title"
    >
      <div className="settings-manual-qa-header">
        <div className="min-w-0">
          <h2 id="settings-manual-qa-title" className="settings-manual-qa-title">
            Manual QA Evidence
          </h2>
          <p className="settings-manual-qa-subtitle">
            Track local-only checks that need a visible OS dialog, account auth
            flow, or human-owned chat action.
          </p>
        </div>
        <div className="settings-manual-qa-summary" aria-label="Manual QA summary">
          <strong>{summary.passed}</strong>
          <span>/{summary.total}</span>
        </div>
      </div>

      <div className="settings-manual-qa-command">
        <span>CLI checklist</span>
        <code>{manualExternalQaCommand}</code>
      </div>

      <div className="settings-manual-qa-overview" role="status">
        <span>{summary.statusLabel}</span>
        <span>{`${summary.pending} pending`}</span>
        <span>{`${summary.failed} need fix`}</span>
      </div>

      <div className="settings-manual-qa-list" role="list">
        {evidence.map((item) => (
          <div key={item.id} className="settings-manual-qa-item" role="listitem">
            <div className="settings-manual-qa-item-line">
              <div className="settings-manual-qa-item-title">{item.label}</div>
              <div
                className={`settings-manual-qa-item-status ${statusClassName(
                  item.status,
                )}`}
              >
                <span aria-hidden="true" />
                {manualExternalQaStatusLabel(item.status)}
              </div>
            </div>
            <div className="settings-manual-qa-copy">
              <span>{item.action}</span>
              <strong>{item.passCriteria}</strong>
              <em>{formatManualExternalQaTimestamp(item.checkedAt)}</em>
            </div>
            <div
              className="settings-manual-qa-actions"
              aria-label={`${item.label} evidence actions`}
            >
              <button
                type="button"
                className="ui-button ui-button-secondary settings-manual-qa-action text-xs"
                onClick={() => updateStatus(item.id, "passed")}
              >
                Mark Passed
              </button>
              <button
                type="button"
                className="ui-button ui-button-secondary settings-manual-qa-action text-xs"
                onClick={() => updateStatus(item.id, "failed")}
              >
                Needs Fix
              </button>
              <button
                type="button"
                className="settings-manual-qa-reset text-xs"
                onClick={() => updateStatus(item.id, "pending")}
              >
                Reset
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="settings-manual-qa-note">
        {storageAvailable
          ? "Stores only status and timestamp in this browser."
          : "Browser storage is unavailable, so evidence is kept in memory for this page only."}{" "}
        It never stores account names, profile paths, prompts, screenshots, or
        auth output.
      </div>
      <span className="sr-only">
        {manualExternalQaItems.length} local manual checks are available.
      </span>
    </section>
  );
}
