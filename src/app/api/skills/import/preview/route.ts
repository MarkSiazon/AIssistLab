import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api/request";
import { withLocalDeviceGuard } from "@/lib/local-access";
import {
  createSkillImportPreview,
  sanitizeImportErrorMessage,
  type SkillImportSource,
} from "@/lib/skills/importer";

export const runtime = "nodejs";

function normalizeImportSource(
  body: Record<string, unknown> | null,
): SkillImportSource {
  if (!body) throw new Error("Import source is required.");

  if (body.sourceType === "folder") {
    return {
      sourceType: "folder",
      path: typeof body.path === "string" ? body.path : "",
    };
  }

  if (body.sourceType === "archive") {
    return {
      sourceType: "archive",
      archiveBase64:
        typeof body.archiveBase64 === "string" ? body.archiveBase64 : "",
      fileName: typeof body.fileName === "string" ? body.fileName : undefined,
    };
  }

  if (body.sourceType === "github") {
    return {
      sourceType: "github",
      url: typeof body.url === "string" ? body.url : "",
    };
  }

  throw new Error("Import source type must be folder, archive, or github.");
}

export const POST = withLocalDeviceGuard(async (request: Request) => {
  try {
    const preview = await createSkillImportPreview(
      normalizeImportSource(await readJsonObject(request)),
    );
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: sanitizeImportErrorMessage(error, "Import preview failed"),
      },
      { status: 400 },
    );
  }
});
