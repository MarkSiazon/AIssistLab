import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api/request";
import { withLocalDeviceGuard } from "@/lib/local-access";
import {
  buildGuidedSkillDraft,
  validateGuidedSkillDraftInput,
} from "@/lib/skills/guided-builder";

export const runtime = "nodejs";

export const POST = withLocalDeviceGuard(async (request: Request) => {
  const body = (await readJsonObject(request)) ?? {};
  const validation = validateGuidedSkillDraftInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, validationErrors: validation.errors },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    validationErrors: [],
    draft: buildGuidedSkillDraft(body),
  });
});
