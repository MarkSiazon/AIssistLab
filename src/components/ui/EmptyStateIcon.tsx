type EmptyStateIconName = "chat" | "editor" | "export" | "search" | "skills";

interface EmptyStateIconProps {
  name: EmptyStateIconName;
  label: string;
}

function iconPaths(name: EmptyStateIconName) {
  if (name === "chat") {
    return (
      <>
        <path d="M5 6.5h14v9H9l-4 3.5V6.5Z" />
        <path d="M8.5 9.5h7" />
        <path d="M8.5 12.5h4.5" />
      </>
    );
  }

  if (name === "editor") {
    return (
      <>
        <path d="M5 5.5h9.5" />
        <path d="M5 9h7" />
        <path d="M5 12.5h5" />
        <path d="m13.5 18.5 5-5 2 2-5 5-2.5.5.5-2.5Z" />
      </>
    );
  }

  if (name === "export") {
    return (
      <>
        <path d="M12 4.5v9" />
        <path d="m8.5 10 3.5 3.5L15.5 10" />
        <path d="M5.5 15.5v3h13v-3" />
      </>
    );
  }

  if (name === "search") {
    return (
      <>
        <path d="M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
        <path d="m16 16 3.5 3.5" />
        <path d="M8.5 10.5h5" />
      </>
    );
  }

  return (
    <>
      <path d="M12 4.5 4.5 8.25 12 12l7.5-3.75L12 4.5Z" />
      <path d="m4.5 12 7.5 3.75L19.5 12" />
      <path d="m4.5 15.75 7.5 3.75 7.5-3.75" />
    </>
  );
}

export function EmptyStateIcon({ name, label }: EmptyStateIconProps) {
  return (
    <div className="empty-state-icon" role="img" aria-label={label}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        focusable="false"
        className="empty-state-icon-svg"
      >
        {iconPaths(name)}
      </svg>
    </div>
  );
}
