import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { listSkillTemplates } from "@/lib/skills/templates";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () =>
  NextResponse.json({ templates: listSkillTemplates() }),
);
