import { NextResponse } from "next/server";
import { withLocalCliGuard } from "@/lib/local-access";
import { getClaudeCliStatus } from "@/lib/rag/llm-config";

export const runtime = "nodejs";

export const GET = withLocalCliGuard(async () => {
  const status = await getClaudeCliStatus();
  return NextResponse.json({
    selectedProfile: status.selectedProfile,
    profiles: status.profiles,
    configDirConfigured: status.configDirConfigured,
    loginCommandSource: status.loginCommandSource,
    canOpenLogin: status.canOpenLogin,
  });
});
