"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { isManagedSkillName } from "@/lib/skills/name";
import { skillEditorHref } from "@/lib/ui/skill-action-links";
import type { Citation } from "@/types/chat";

export function CitationBadge({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  const previewId = useId();
  const scoreText =
    typeof citation.score === "number"
      ? `${Math.min(100, Math.max(0, citation.score * 100)).toFixed(0)}%`
      : null;
  const canOpenInEditor = isManagedSkillName(citation.skillName);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="chat-citation-toggle"
        aria-expanded={open}
        aria-controls={open ? previewId : undefined}
        aria-label={`${open ? "Hide" : "Show"} citation preview for ${citation.skillName}.md, ${citation.section}`}
      >
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
        <span>{citation.skillName}.md</span>
        <span style={{ opacity: 0.6 }}>({citation.section})</span>
        {scoreText ? (
          <span className="chat-citation-score">{scoreText}</span>
        ) : null}
      </button>
      {open && (
        <div id={previewId} className="chat-citation-preview">
          <div className="chat-citation-preview-text">{citation.preview}</div>
          <div className="chat-citation-actions">
            {canOpenInEditor ? (
              <Link
                href={skillEditorHref(citation.skillName)}
                className="chat-citation-link"
              >
                Open source skill
              </Link>
            ) : (
              <span className="chat-citation-link" aria-disabled="true">
                Read-only source
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
