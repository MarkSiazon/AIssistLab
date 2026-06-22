import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { browsePath } from "@/lib/settings/path-browser";

interface BrowseRouteDependencies {
  browsePath?: typeof browsePath;
}

export function createBrowseRouteHandlers(
  dependencies: BrowseRouteDependencies = {},
) {
  const browse = dependencies.browsePath ?? browsePath;

  return {
    GET: withLocalDeviceGuard(async (request: Request) => {
      const { searchParams } = new URL(request.url);
      const reqPath = searchParams.get("path")?.trim() ?? "";

      return NextResponse.json(await browse(reqPath));
    }),
  };
}
