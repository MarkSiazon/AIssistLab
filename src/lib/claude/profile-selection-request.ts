import type { ClaudeProfileSelectionInput } from "@/lib/claude/discovery";
import { readJsonObject } from "@/lib/api/request";

interface ClaudeProfileSelectionRequestBody {
  profileSelection?: ClaudeProfileSelectionInput;
  profileId?: string;
  manualConfigDir?: string;
}

function sanitizedProfileSelection(value: unknown): ClaudeProfileSelectionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as ClaudeProfileSelectionInput;
  const selection: ClaudeProfileSelectionInput = {};
  if (typeof input.profileId === "string") selection.profileId = input.profileId;
  if (typeof input.manualConfigDir === "string") {
    selection.manualConfigDir = input.manualConfigDir;
  }
  return selection;
}

export async function readClaudeProfileSelectionRequest(
  request: Request,
): Promise<ClaudeProfileSelectionInput> {
  const body = (await readJsonObject(request)) as
    | ClaudeProfileSelectionRequestBody
    | null;

  if (body?.profileSelection) {
    return sanitizedProfileSelection(body.profileSelection);
  }

  return {
    profileId: typeof body?.profileId === "string" ? body.profileId : undefined,
    manualConfigDir:
      typeof body?.manualConfigDir === "string" ? body.manualConfigDir : undefined,
  };
}
