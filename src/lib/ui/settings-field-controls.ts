import { isAbsolutePathValue } from "@/lib/ui/path-picker-model";

export interface RelativePathFieldState {
  browseFrom: string | undefined;
  resolvedPath: string | null;
}

function stripTrailingSeparator(value: string): string {
  return value.replace(/[\\/]$/, "");
}

function pathSeparatorFor(value: string): "\\" | "/" {
  return value.includes("\\") ? "\\" : "/";
}

function joinSettingsPath(root: string, value: string): string {
  const separator = pathSeparatorFor(root);
  const relative = value
    .replace(/^[\\/]+/, "")
    .replace(/^\.[\\/]+/, "")
    .replace(/[\\/]+/g, separator);
  const base = stripTrailingSeparator(root);
  return relative === "." || relative === "" ? base : `${base}${separator}${relative}`;
}

export function toRelativeSettingsPath(absPath: string, root: string): string {
  const normalize = (value: string) =>
    value.replace(/\\/g, "/").replace(/\/$/, "");
  const normalizedRoot = normalize(root);
  const normalizedPath = normalize(absPath);
  const rootPrefix = `${normalizedRoot}/`;

  if (normalizedPath.toLowerCase() === normalizedRoot.toLowerCase()) return ".";

  if (normalizedPath.toLowerCase().startsWith(rootPrefix.toLowerCase())) {
    return normalizedPath.slice(rootPrefix.length) || ".";
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
    workspaceRoot && value && !isAbsolutePathValue(value)
      ? joinSettingsPath(workspaceRoot, value)
      : value;

  return {
    browseFrom: absoluteValue || workspaceRoot || undefined,
    resolvedPath: workspaceRoot && value ? absoluteValue : null,
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
