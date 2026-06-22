import { createBrowseRouteHandlers } from "./handlers";

export const runtime = "nodejs";

const handlers = createBrowseRouteHandlers();

export const GET = handlers.GET;
