import { readAllSkills, readSkill } from "@/lib/skills/reader";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { jsonError, textDownloadResponse } from "@/lib/api/responses";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const skillName = searchParams.get("skill");

  if (!skillName) {
    return jsonError("skill param required", 400);
  }

  const skill =
    (await readSkill(skillName)) ??
    (await readAllSkills()).find((item) => item.name === skillName);
  if (!skill) {
    return jsonError("Not found", 404);
  }

  return textDownloadResponse(skill.raw, `${skillName}.md`, "text/markdown");
});
