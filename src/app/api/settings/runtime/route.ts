import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { getActiveRuntimeProviderStatus } from "@/lib/settings/runtime-config";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () =>
  NextResponse.json(getActiveRuntimeProviderStatus()),
);
