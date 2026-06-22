import { createBrowseSearchRouteHandlers } from "./handlers";

export const runtime = "nodejs";

const handlers = createBrowseSearchRouteHandlers();

export const GET = handlers.GET;
