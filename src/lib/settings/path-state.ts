import fs from "node:fs/promises";
import { expandUserPath } from "@/lib/claude/discovery-paths";

export interface SettingsPathState {
  exists: boolean;
  isDirectory: boolean;
}

export const missingPathState: SettingsPathState = {
  exists: false,
  isDirectory: false,
};

export async function getSettingsPathState(
  value: string | null | undefined,
): Promise<SettingsPathState> {
  if (!value?.trim()) return missingPathState;

  try {
    const stat = await fs.stat(expandUserPath(value));
    return { exists: true, isDirectory: stat.isDirectory() };
  } catch {
    return missingPathState;
  }
}
