import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/responses";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { searchDirectoriesByName } from "@/lib/settings/path-browser";

interface BrowseSearchRouteDependencies {
  searchDirectoriesByName?: typeof searchDirectoriesByName;
}

export function createBrowseSearchRouteHandlers(
  dependencies: BrowseSearchRouteDependencies = {},
) {
  const search = dependencies.searchDirectoriesByName ?? searchDirectoriesByName;

  return {
    GET: withLocalDeviceGuard(async (request: Request) => {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name")?.trim();

      if (!name) {
        return jsonError("name query param required", 400);
      }

      return NextResponse.json(await search(name));
    }),
  };
}
