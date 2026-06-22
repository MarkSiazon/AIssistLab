import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api/request";
import {
  resolveClaudeProfileSelection,
  type ClaudeProfileSelectionInput,
} from "@/lib/claude/discovery";
import { withLocalDeviceGuard } from "@/lib/local-access";
import {
  ENV_PATH,
  parseEnv,
  readEnvFile,
  serializeEnv,
  writeEnvFile,
} from "@/lib/settings/env";
import { applyRuntimeProviderSettings } from "@/lib/settings/runtime-config";
import { clearClaudeCliStatusCache } from "@/lib/rag/claude-cli-status";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () =>
  NextResponse.json(await readEnvFile()),
);

export const POST = withLocalDeviceGuard(async (request: Request) => {
  const body = await readJsonObject(request);

  let content: string;

  if (typeof body?.raw === "string") {
    // Raw .env content posted directly
    content = body.raw;
  } else if (
    body?.vars &&
    typeof body.vars === "object" &&
    !Array.isArray(body.vars)
  ) {
    // Structured key-value pairs
    const vars = { ...(body.vars as Record<string, string>) };
    const claudeProfileSelection = body.claudeProfileSelection as
      | ClaudeProfileSelectionInput
      | undefined;
    if (claudeProfileSelection) {
      const resolvedProfile = await resolveClaudeProfileSelection(
        claudeProfileSelection,
        {
          configuredConfigDir: vars.CLAUDE_CONFIG_DIR ?? "",
        },
      );
      vars.CLAUDE_CONFIG_DIR = resolvedProfile.internalProfile.portableConfigDir;
    }
    content = serializeEnv(vars);
  } else {
    return NextResponse.json(
      { error: "Provide either raw or vars" },
      { status: 400 },
    );
  }

  await writeEnvFile(content);
  const parsed = parseEnv(content);
  const activeRuntime = applyRuntimeProviderSettings(parsed);
  clearClaudeCliStatusCache();

  return NextResponse.json({
    ok: true,
    path: ENV_PATH,
    raw: content,
    parsed,
    runtimeApplied: true,
    activeRuntime,
  });
});
