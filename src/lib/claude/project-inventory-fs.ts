import type { Dirent } from "node:fs";
import fs from "node:fs/promises";

export async function directoryExists(value: string): Promise<boolean> {
  try {
    return (await fs.stat(value)).isDirectory();
  } catch {
    return false;
  }
}

export async function fileExists(value: string): Promise<boolean> {
  try {
    return (await fs.stat(value)).isFile();
  } catch {
    return false;
  }
}

export async function readDirectory(value: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(value, { withFileTypes: true });
  } catch {
    return [];
  }
}

export async function readJsonObject(
  filePath: string,
): Promise<{
  exists: boolean;
  parsed: Record<string, unknown> | null;
  malformed: boolean;
}> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return {
      exists: true,
      parsed:
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : null,
      malformed: false,
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { exists: false, parsed: null, malformed: false };
    }
    return { exists: true, parsed: null, malformed: true };
  }
}
