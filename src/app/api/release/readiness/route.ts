import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { getCurrentReleaseReadinessEvidence } from "@/lib/release/readiness-report";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () => {
  const evidence = await getCurrentReleaseReadinessEvidence();

  return NextResponse.json(evidence.readiness);
});
