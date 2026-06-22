export interface RelativePathFieldState {
  browseFrom: string | undefined;
  resolvedPath: string | null;
}

function stripTrailingSeparator(value: string): string {
  return value.replace(/[\\/]$/, "");
}

export function toRelativeSettingsPath(absPath: string, root: string): string {
  const normalize = (value: string) =>
    value.replace(/\\/g, "/").replace(/\/$/, "");
  const normalizedRoot = normalize(root);
  const normalizedPath = normalize(absPath);

  if (normalizedPath.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
    const relative = normalizedPath.slice(normalizedRoot.length).replace(/^\//, "");
    return relative || ".";
  }

  return absPath;
}

export function getRelativePathFieldState({
  value,
  workspaceRoot,
}: {
  value: string;
  workspaceRoot: string;
}): RelativePathFieldState {
  const absoluteValue =
    workspaceRoot && value && !value.match(/^[A-Za-z]:/)
      ? [stripTrailingSeparator(workspaceRoot), value].join("\\")
      : value;

  return {
    browseFrom: absoluteValue || workspaceRoot || undefined,
    resolvedPath:
      workspaceRoot && value
        ? [stripTrailingSeparator(workspaceRoot), value].join("\\")
        : null,
  };
}

export function getSelectFieldValue({
  value,
  defaultValue,
  placeholder,
}: {
  value: string;
  defaultValue?: string;
  placeholder: string;
}): string {
  return value || defaultValue || placeholder;
}

export function getPasswordFieldState({
  visible,
  label,
}: {
  visible: boolean;
  label: string;
}) {
  return {
    inputType: visible ? "text" : "password",
    toggleLabel: visible ? "Hide" : "Show",
    toggleAriaLabel: `${visible ? "Hide" : "Show"} ${label}`,
  };
}
