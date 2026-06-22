"use client";

export function GuidedInlineStatus({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      className="guided-inline-status"
      role="status"
      style={{ color: "var(--yellow)" }}
    >
      {message}
    </div>
  );
}
