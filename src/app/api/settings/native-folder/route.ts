import { createNativeFolderRouteHandlers } from "./handlers";

export const runtime = "nodejs";

const handlers = createNativeFolderRouteHandlers();

export const GET = handlers.GET;
