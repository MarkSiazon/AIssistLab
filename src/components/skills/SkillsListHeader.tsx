"use client";

import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes/app-routes";

export function SkillsListHeader({ total }: { total: number | null }) {
  return (
    <div
      className="skills-list-header border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <h1 className="m-0 text-sm font-semibold">
        Skills {typeof total === "number" ? `(${total})` : ""}
      </h1>
      <div className="skills-header-actions">
        <Link
          href={APP_ROUTES.guidedBuilder}
          className="ui-button ui-button-secondary text-xs"
        >
          Guided
        </Link>
        <Link
          href={APP_ROUTES.editor}
          className="ui-button ui-button-primary text-xs"
        >
          New
        </Link>
      </div>
    </div>
  );
}
