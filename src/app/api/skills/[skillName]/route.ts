import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api/request";
import { readAllSkills, readSkill } from "@/lib/skills/reader";
import { writeSkill } from "@/lib/skills/writer";
import { moveSkillToTrash } from "@/lib/skills/trash";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { markIndexDirty } from "@/lib/store";
import {
  normalizeSkillFrontmatter,
  toWritableSkillFrontmatter,
  validateSkillInput,
} from "@/lib/skills/validation";
import { jsonError } from "@/lib/api/responses";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async (
  request: Request,
  { params }: { params: Promise<{ skillName: string }> },
) => {
  void request;
  const { skillName } = await params;
  const skill =
    (await readSkill(skillName)) ??
    (await readAllSkills()).find((item) => item.name === skillName);
  if (!skill) return jsonError("Not found", 404);
  return NextResponse.json(skill);
});

export const PUT = withLocalDeviceGuard(async (
  request: Request,
  { params }: { params: Promise<{ skillName: string }> },
) => {
  const { skillName } = await params;
  const payload = (await readJsonObject(request)) ?? {};
  const frontmatter = normalizeSkillFrontmatter(payload.frontmatter);
  const body = typeof payload.body === "string" ? payload.body : "";
  const validation = validateSkillInput({
    name: skillName,
    frontmatter,
    body,
  });
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, validationErrors: validation.errors },
      { status: 400 },
    );
  }

  await writeSkill(skillName, toWritableSkillFrontmatter(frontmatter), body);
  const indexState = await markIndexDirty("Skill files changed after save.");
  return NextResponse.json({ ok: true, validationErrors: [], indexState });
});

export const DELETE = withLocalDeviceGuard(async (
  request: Request,
  { params }: { params: Promise<{ skillName: string }> },
) => {
  const { skillName } = await params;
  const skill = await readSkill(skillName);
  if (!skill) return jsonError("Not found", 404);

  const body = (await readJsonObject(request)) ?? {};
  const confirmName =
    typeof body.confirmName === "string" ? body.confirmName : "";
  if (confirmName !== skillName) {
    return NextResponse.json(
      {
        ok: false,
        error: "Type the exact skill name to confirm delete.",
      },
      { status: 400 },
    );
  }

  const trash = await moveSkillToTrash(skillName);
  const indexState = await markIndexDirty("Skill files changed after delete.");
  return NextResponse.json({ ok: true, trash, indexState });
});
