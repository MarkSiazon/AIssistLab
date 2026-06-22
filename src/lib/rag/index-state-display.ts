function ellipsizeAbsolutePath(value: string): string {
  if (value.startsWith("~")) return value;

  const separator = value.includes("\\") ? "\\" : "/";
  const isWindowsPath = /^[A-Z]:[\\/]/i.test(value);
  const isPosixPath = value.startsWith("/");

  if (!isWindowsPath && !isPosixPath) return value;

  const parts = value.split(/[\\/]+/).filter(Boolean);
  const pathParts = isWindowsPath ? parts.slice(1) : parts;
  const tail = pathParts.slice(-3);

  return tail.length > 0
    ? `...${separator}${tail.join(separator)}`
    : `...${separator}`;
}

export function sanitizeDisplayPath(value: string): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  let next = value;
  if (home) {
    const escapedHome = home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(escapedHome, "gi"), "~");
  }

  const sanitized = next
    .replace(/[A-Z]:\\Users\\[^\\\s"]+/gi, "~")
    .replace(/[^\s\\/@]+@[^\s\\/]+\.[^\s\\/]+/gi, "[redacted-email]")
    .replace(
      /\b(?:sk-ant-[A-Za-z0-9_-]+|[A-Za-z0-9_-]*token[A-Za-z0-9_-]*)\b/gi,
      "[redacted]",
    );

  return ellipsizeAbsolutePath(sanitized);
}

export function sanitizeError(value: string): string {
  return sanitizeDisplayPath(value).replace(
    /\b(?:secret|oauth|credential)[A-Za-z0-9_-]*\b/gi,
    "[redacted]",
  );
}
