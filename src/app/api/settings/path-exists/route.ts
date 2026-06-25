import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import {
  getSettingsPathState,
  missingPathState,
} from "@/lib/settings/path-state";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path")?.trim();
    return NextResponse.json(await getSettingsPathState(path));
  } catch {
    return NextResponse.json(missingPathState);
  }
});
