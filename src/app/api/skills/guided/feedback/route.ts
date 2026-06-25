import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api/request";
import { jsonValidationFailure } from "@/lib/api/responses";
import { withLocalDeviceGuard } from "@/lib/local-access";
import {
  buildGuidedSkillFeedback,
  validateGuidedSkillDraftInput,
} from "@/lib/skills/guided-builder";

export const runtime = "nodejs";

export const POST = withLocalDeviceGuard(async (request: Request) => {
  const body = (await readJsonObject(request)) ?? {};
  const validation = validateGuidedSkillDraftInput(body);
  if (!validation.ok) {
    return jsonValidationFailure(
      validation.errors,
      400,
      { feedback: buildGuidedSkillFeedback(body) },
    );
  }

  return NextResponse.json({
    ok: true,
    validationErrors: [],
    feedback: buildGuidedSkillFeedback(body),
  });
});
