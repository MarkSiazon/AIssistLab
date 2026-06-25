"use client";

import Link from "next/link";
import { EmptyStateIcon } from "@/components/ui/EmptyStateIcon";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import type { SkillSummary } from "@/lib/ui/skills-page-model";

interface SkillsListContentProps {
  skills: SkillSummary[];
  selectedName: string | null;
  isLoading: boolean;
  error: unknown;
  hasSearch: boolean;
  emptyTitle: string;
  emptyMessage: string;
  onSelectSkill: (name: string) => void;
  onClearSearch: () => void;
}

export function SkillsListContent({
  skills,
  selectedName,
  isLoading,
  error,
  hasSearch,
  emptyTitle,
  emptyMessage,
  onSelectSkill,
  onClearSearch,
}: SkillsListContentProps) {
  const hasError = Boolean(error);

  return (
    <div className="skills-list-scroll">
      {isLoading && (
        <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Loading skills...
        </div>
      )}
      {hasError && (
        <div className="p-4 text-sm" style={{ color: "var(--red)" }}>
          Failed to load skills
        </div>
      )}
      {skills.map((skill) => (
        <button
          key={skill.name}
          type="button"
          onClick={() => onSelectSkill(skill.name)}
          className="w-full text-left px-4 py-3 border-b cursor-pointer transition-colors"
          style={{
            borderColor: "var(--border)",
            background:
              selectedName === skill.name ? "var(--surface-2)" : "transparent",
            borderLeft:
              selectedName === skill.name
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            color: "var(--text)",
            minHeight: "44px",
          }}
        >
          <div className="text-sm font-medium">{skill.name}</div>
          <div
            className="text-xs mt-0.5 line-clamp-2"
            style={{ color: "var(--text-muted)" }}
          >
            {skill.description}
          </div>
          {skill.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-muted)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)", opacity: 0.6 }}
          >
            {new Date(skill.updatedAt).toLocaleDateString()}
          </div>
        </button>
      ))}
      {!isLoading && skills.length === 0 && (
        <div className="skills-list-empty">
          <EmptyStateIcon
            name={hasSearch ? "search" : "skills"}
            label={emptyTitle}
          />
          <div>
            <div className="skills-list-empty-title">{emptyTitle}</div>
            <div className="skills-list-empty-copy">{emptyMessage}</div>
          </div>
          <div className="skills-list-empty-actions">
            {hasSearch ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="ui-button ui-button-primary text-sm"
              >
                Clear Search
              </button>
            ) : (
              <Link
                href={APP_ROUTES.guidedBuilder}
                className="ui-button ui-button-primary text-sm"
              >
                Guided Builder
              </Link>
            )}
            <Link
              href={APP_ROUTES.editor}
              className="ui-button ui-button-secondary text-sm"
            >
              New Skill
            </Link>
            {!hasSearch && (
              <a
                href="#skills-import-panel"
                className="ui-button ui-button-secondary text-sm"
              >
                Import Skills
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
