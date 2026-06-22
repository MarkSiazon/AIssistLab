import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { getIndexStatus, rebuildIndex } from "@/lib/store";

export const runtime = "nodejs";

export const POST = withLocalDeviceGuard(async () => {
  const state = await rebuildIndex();
  return NextResponse.json(state, {
    status: state.status === "failed" ? 500 : 200,
  });
});

export const GET = withLocalDeviceGuard(async () =>
  NextResponse.json(await getIndexStatus()),
);
