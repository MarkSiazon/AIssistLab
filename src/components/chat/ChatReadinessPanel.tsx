"use client";

import { useId } from "react";
import type { ChatReadinessRow } from "@/lib/ui/chat-readiness-panel";

interface ChatReadinessPanelProps {
  status: "ready" | "blocked" | "checking" | "unavailable";
  subtitle: string;
  rows: ChatReadinessRow[];
  pendingDetail?: string | null;
}

export function ChatReadinessPanel({
  status,
  subtitle,
  rows,
  pendingDetail,
}: ChatReadinessPanelProps) {
  const titleId = useId();
  const statusTone =
    status === "ready" ? "ok" : status === "checking" ? "warn" : "error";
  const statusLabel =
    status === "ready"
      ? "Ready"
      : status === "blocked"
        ? "Blocked"
        : status === "checking"
          ? "Checking"
          : "Unavailable";

  return (
    <section className="chat-readiness-panel" aria-labelledby={titleId}>
      <div className="chat-readiness-header">
        <div>
          <div className="chat-readiness-kicker">First chat</div>
          <h2 id={titleId} className="chat-readiness-title">
            Chat Readiness
          </h2>
          <div className="chat-readiness-subtitle">{subtitle}</div>
        </div>
        <span className={`chat-status-chip chat-status-chip-${statusTone}`}>
          <span className="chat-status-chip-dot" aria-hidden="true" />
          {statusLabel}
        </span>
      </div>
      <div className="chat-readiness-grid">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div
              key={row.label}
              className={`chat-readiness-item chat-readiness-item-${row.tone}`}
            >
              <div className="chat-readiness-item-label">{row.label}</div>
              <div className="chat-readiness-item-value">{row.value}</div>
              <div className="chat-readiness-item-detail">{row.detail}</div>
            </div>
          ))
        ) : (
          <div
            className={`chat-readiness-item chat-readiness-item-${statusTone}`}
          >
            <div className="chat-readiness-item-label">Status</div>
            <div className="chat-readiness-item-value">
              {status === "checking" ? "Loading" : "Unavailable"}
            </div>
            <div className="chat-readiness-item-detail">{pendingDetail}</div>
          </div>
        )}
      </div>
    </section>
  );
}
