import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { readAllSkills } from "@/lib/skills/reader";
import { buildSkillQualityReport } from "@/lib/skills/quality";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () => {
  const skills = await readAllSkills();
  return NextResponse.json(buildSkillQualityReport(skills));
});
