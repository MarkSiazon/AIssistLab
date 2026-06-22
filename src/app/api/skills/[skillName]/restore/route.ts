import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { restoreLatestDeletedSkill } from "@/lib/skills/trash";
import { markIndexDirty } from "@/lib/store";

export const runtime = "nodejs";

export const POST = withLocalDeviceGuard(async (
  request: Request,
  { params }: { params: Promise<{ skillName: string }> },
) => {
  void request;
  const { skillName } = await params;
  try {
    const restored = await restoreLatestDeletedSkill(skillName);
    const indexState = await markIndexDirty("Skill files changed after restore.");
    return NextResponse.json({ ok: true, restored, indexState });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Restore failed",
      },
      { status: 400 },
    );
  }
});
