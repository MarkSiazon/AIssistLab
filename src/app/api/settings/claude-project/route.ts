import { NextResponse } from "next/server";
import { getClaudeProjectInventory } from "@/lib/claude/project-inventory";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { readEnvFile } from "@/lib/settings/env";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () => {
  const envFile = await readEnvFile();
  const workspaceRoot =
    process.env.WORKSPACE_ROOT ?? envFile.parsed.WORKSPACE_ROOT ?? process.cwd();
  const inventory = await getClaudeProjectInventory(workspaceRoot);
  return NextResponse.json(inventory);
});
