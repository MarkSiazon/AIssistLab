import { NextResponse } from "next/server";
import fs from "fs/promises";
import { expandUserPath } from "@/lib/claude/discovery-paths";
import { withLocalDeviceGuard } from "@/lib/local-access";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path")?.trim();

    if (!path) {
      return NextResponse.json({ exists: false, isDirectory: false });
    }

    try {
      const stat = await fs.stat(expandUserPath(path));
      return NextResponse.json({
        exists: true,
        isDirectory: stat.isDirectory(),
      });
    } catch {
      return NextResponse.json({ exists: false, isDirectory: false });
    }
  } catch {
    return NextResponse.json({ exists: false, isDirectory: false });
  }
});
