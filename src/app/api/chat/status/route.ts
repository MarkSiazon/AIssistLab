import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { getCurrentChatStatus } from "@/lib/chat/status";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () =>
  NextResponse.json(await getCurrentChatStatus()),
);
