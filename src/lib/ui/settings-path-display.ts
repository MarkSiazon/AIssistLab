export function displayLocalPath(value: string): string {
  return value
    .replace(/[A-Z]:\\Users\\[^\\\s"]+/gi, "~")
    .replace(/[^\s\\/@]+@[^\s\\/]+\.[^\s\\/]+/gi, "[redacted-email]");
}

export function displaySettingsPath(value: string | undefined): string {
  if (!value) return "Settings file not loaded";

  const sanitized = displayLocalPath(value);
  if (sanitized.length <= 58) return sanitized;

  const parts = sanitized.split(/[\\/]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `.../${parts.slice(-2).join("/")}`;
  }

  return `${sanitized.slice(0, 26)}...${sanitized.slice(-26)}`;
}
