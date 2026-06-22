import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api/request";
import { readAllSkills, readSkill } from "@/lib/skills/reader";
import { writeSkill } from "@/lib/skills/writer";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { markIndexDirty } from "@/lib/store";
import { getLatestDeletedSkill } from "@/lib/skills/trash";
import {
  normalizeSkillFrontmatter,
  toWritableSkillFrontmatter,
  validateSkillInput,
  type SkillValidationError,
} from "@/lib/skills/validation";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () => {
  const skills = await readAllSkills();

  return NextResponse.json({
    skills: skills.map((s) => ({
      name: s.name,
      description: s.frontmatter.description,
      tags: s.frontmatter.tags ?? [],
      updatedAt: s.updatedAt,
    })),
    total: skills.length,
    latestDeleted: await getLatestDeletedSkill(),
  });
});

export const POST = withLocalDeviceGuard(async (request: Request) => {
  const body = (await readJsonObject(request)) ?? {};
  const { name, frontmatter, content } = body;
  const safeName = typeof name === "string" ? name : "";
  const safeFrontmatter = normalizeSkillFrontmatter(frontmatter);
  const safeContent = typeof content === "string" ? content : "";

  const validation = validateSkillInput({
    name: safeName,
    frontmatter: safeFrontmatter,
    body: safeContent,
  });
  const validationErrors: SkillValidationError[] = [...validation.errors];
  if (validation.ok && (await readSkill(safeName))) {
    validationErrors.push({
      field: "name",
      code: "duplicate_name",
      message: "A skill with this name already exists.",
    });
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        validationErrors,
      },
      { status: 400 },
    );
  }

  await writeSkill(
    safeName,
    toWritableSkillFrontmatter(safeFrontmatter),
    safeContent,
  );
  const indexState = await markIndexDirty("Skill files changed after save.");
  return NextResponse.json({ ok: true, validationErrors: [], indexState });
});
