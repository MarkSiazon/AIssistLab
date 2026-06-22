import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api/request";
import { withLocalDeviceGuard } from "@/lib/local-access";
import {
  applySkillImportPreview,
  sanitizeImportErrorMessage,
  type DuplicateStrategy,
} from "@/lib/skills/importer";
import { markIndexDirty } from "@/lib/store";

export const runtime = "nodejs";

export const POST = withLocalDeviceGuard(async (request: Request) => {
  try {
    const body = (await readJsonObject(request)) ?? {};
    const duplicateStrategy: DuplicateStrategy | string =
      typeof body.duplicateStrategy === "string"
        ? body.duplicateStrategy
        : "skip";
    const result = await applySkillImportPreview({
      previewId: typeof body.previewId === "string" ? body.previewId : "",
      confirm: body.confirm === true,
      duplicateStrategy,
    });
    const indexState = await markIndexDirty("Skill files changed after import.");
    return NextResponse.json({ ...result, indexState });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: sanitizeImportErrorMessage(error, "Import apply failed"),
      },
      { status: 400 },
    );
  }
});
