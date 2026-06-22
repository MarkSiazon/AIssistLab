import { createClaudeCliTestRouteHandlers } from "./handlers";

export const runtime = "nodejs";

const handlers = createClaudeCliTestRouteHandlers();

export const POST = handlers.POST;
