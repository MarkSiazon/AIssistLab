import { createClaudeCliProfilesRouteHandlers } from "./handlers";

export const runtime = "nodejs";

export const { GET } = createClaudeCliProfilesRouteHandlers();
