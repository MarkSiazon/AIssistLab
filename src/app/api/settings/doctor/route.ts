import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { getCurrentSetupDoctorReport } from "@/lib/settings/doctor-report";

export const runtime = "nodejs";

export const GET = withLocalDeviceGuard(async () =>
  NextResponse.json(await getCurrentSetupDoctorReport()),
);
