import { createClaudeCliRouteHandlers } from "./handlers";

export const runtime = "nodejs";

const handlers = createClaudeCliRouteHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;
