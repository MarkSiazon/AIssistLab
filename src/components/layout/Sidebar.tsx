"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { requestJson } from "@/lib/api/client";
import {
  indexStatusAnnouncement,
  indexStatusCountsLabel,
  indexStatusColor,
  indexStatusLabel,
  type RagIndexStatusSnapshot,
} from "@/lib/ui/index-status-summary";

type RagIndexState = RagIndexStatusSnapshot;

const NAV = [
  { href: "/skills", label: "Skills", icon: "layers" },
  { href: "/chat", label: "RAG Chat", icon: "message" },
  { href: "/editor", label: "New Skill", icon: "edit" },
  { href: "/export", label: "Export", icon: "archive" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="app-nav-icon"
      focusable="false"
    >
      {name === "layers" && (
        <>
          <path {...common} d="M12 4 4 8l8 4 8-4-8-4Z" />
          <path {...common} d="m4 12 8 4 8-4" />
          <path {...common} d="m4 16 8 4 8-4" />
        </>
      )}
      {name === "message" && (
        <>
          <path {...common} d="M5 6h14v9H8l-3 3V6Z" />
          <path {...common} d="M8 9h8" />
          <path {...common} d="M8 12h5" />
        </>
      )}
      {name === "edit" && (
        <>
          <path {...common} d="M5 19h14" />
          <path {...common} d="M7 16.5 16.5 7l2.5 2.5-9.5 9.5H7v-2.5Z" />
          <path {...common} d="m15 8.5 2.5 2.5" />
        </>
      )}
      {name === "archive" && (
        <>
          <path {...common} d="M5 8h14v11H5V8Z" />
          <path {...common} d="M4 5h16v3H4V5Z" />
          <path {...common} d="M9 12h6" />
        </>
      )}
      {name === "settings" && (
        <>
          <path
            {...common}
            d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
          />
          <path
            {...common}
            d="M12 3v2.3M12 18.7V21M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2"
          />
        </>
      )}
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [rebuilding, setRebuilding] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [indexStatus, setIndexStatus] = useState<RagIndexState | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const loadIndexStatus = useCallback(async (): Promise<boolean> => {
    setIndexLoading(true);
    setIndexError(null);
    try {
      const data = await requestJson<RagIndexState>(
        "/api/index",
        undefined,
        "Unable to load index",
      );
      setIndexStatus(data);
      return true;
    } catch (err) {
      setIndexStatus(null);
      setIndexError(
        err instanceof Error ? err.message : "Unable to load index status.",
      );
      return false;
    } finally {
      setIndexLoading(false);
    }
  }, []);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    async function loadWithRetry() {
      const ok = await loadIndexStatus();
      if (!ok && !cancelled) {
        retryTimer = setTimeout(() => {
          if (!cancelled) {
            loadIndexStatus();
          }
        }, 1200);
      }
    }

    loadWithRetry();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [loadIndexStatus]);

  async function rebuildIndex() {
    setRebuilding(true);
    setStatus(null);
    try {
      const data = await requestJson<RagIndexState>(
        "/api/index",
        { method: "POST" },
        "Error rebuilding index",
      );
      setIndexStatus(data);
      setIndexError(null);
      setStatus(`Index ${data.status}: ${data.skillCount} skills, ${data.chunkCount} chunks`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error rebuilding index";
      setIndexError(message);
      setStatus(message);
    } finally {
      setRebuilding(false);
      setTimeout(() => setStatus(null), 4000);
    }
  }

  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      {/* Logo */}
      <div className="app-brand">
        <div className="app-brand-title">
          Skill Workshop
        </div>
        <div className="app-brand-subtitle">
          Claude Code CLI
        </div>
      </div>

      {/* Nav */}
      <nav className="app-nav" aria-label="Main sections">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`app-nav-link${active ? " app-nav-link-active" : ""}`}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rebuild Index */}
      <div className="app-sidebar-footer">
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {indexStatusAnnouncement(indexStatus, indexLoading, indexError)}
        </div>
        <div
          className="app-sidebar-index"
          role="group"
          aria-label={indexStatusAnnouncement(indexStatus, indexLoading, indexError)}
        >
          <div className="app-sidebar-index-head">
            <span
              className="ui-status-dot"
              style={{
                background: indexStatus
                  ? indexStatusColor(indexStatus.status)
                  : "var(--text-muted)",
              }}
            />
            <span className="app-sidebar-index-label">
              Index {indexStatus ? indexStatusLabel(indexStatus.status) : indexLoading ? "Loading" : "Unavailable"}
            </span>
          </div>
          {indexStatus ? (
            <>
              <div className="app-sidebar-index-counts">
                {indexStatusCountsLabel(indexStatus)}
              </div>
              {(indexStatus.staleReason || indexStatus.error) && (
                <div
                  className="app-sidebar-index-hint"
                  title={indexStatus.staleReason ?? indexStatus.error ?? undefined}
                >
                  {indexStatus.staleReason ?? indexStatus.error}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="app-sidebar-index-counts">
                {indexLoading
                  ? "Checking index..."
                  : indexError ?? "Status check failed"}
              </div>
              {!indexLoading && (
                <button
                  type="button"
                  onClick={() => loadIndexStatus()}
                  className="app-sidebar-index-retry"
                >
                  Retry status
                </button>
              )}
            </>
          )}
        </div>
        {status && (
          <div className="app-sidebar-status" role="status" aria-live="polite">
            {status}
          </div>
        )}
        <button
          type="button"
          onClick={rebuildIndex}
          disabled={rebuilding}
          className="ui-button ui-button-secondary w-full text-xs"
        >
          {rebuilding ? "Rebuilding..." : "Rebuild Index"}
        </button>
      </div>
    </aside>
  );
}
