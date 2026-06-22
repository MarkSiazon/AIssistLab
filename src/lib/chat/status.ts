import { getChatReadiness, type ChatReadiness } from "@/lib/chat/readiness";
import {
  getLastClaudeCliTest,
  getLlmProvider,
  isClaudeCliEnabled,
  type ClaudeCliTestResult,
  type LlmProvider,
} from "@/lib/rag/llm-config";
import type { PublicIndexState } from "@/lib/rag/index-state";
import {
  getActiveRuntimeProviderStatus,
  getRuntimeProviderValue,
  type ActiveRuntimeProviderStatus,
} from "@/lib/settings/runtime-config";
import { readAllSkills } from "@/lib/skills/reader";
import { getIndexStatus } from "@/lib/store";

export interface CurrentChatStatusOptions {
  includeSuggestedQuestions?: boolean;
  index?: PublicIndexState;
}

export interface CurrentChatStatus extends ChatReadiness {
  provider: LlmProvider;
  runtimeSource: ActiveRuntimeProviderStatus["source"];
  claudeCliEnabled: boolean;
  index: PublicIndexState;
  lastCliSmokeTest: ClaudeCliTestResult | null;
  suggestedQuestions: string[];
}

async function getSuggestedQuestions(): Promise<string[]> {
  try {
    const skills = await readAllSkills();
    return skills.slice(0, 3).map((skill) => `How should I use ${skill.name}?`);
  } catch {
    return [];
  }
}

export async function getCurrentChatStatus({
  includeSuggestedQuestions = true,
  index,
}: CurrentChatStatusOptions = {}): Promise<CurrentChatStatus> {
  const runtimeStatus = getActiveRuntimeProviderStatus();
  const provider = getLlmProvider();
  const claudeCliEnabled = isClaudeCliEnabled();
  const resolvedIndex = index ?? (await getIndexStatus());
  const readiness = getChatReadiness({
    provider,
    claudeCliEnabled,
    index: resolvedIndex,
    apiKey: getRuntimeProviderValue("ANTHROPIC_API_KEY"),
  });

  return {
    provider,
    runtimeSource: runtimeStatus.source,
    claudeCliEnabled,
    index: resolvedIndex,
    lastCliSmokeTest: getLastClaudeCliTest(),
    ...readiness,
    suggestedQuestions: includeSuggestedQuestions
      ? await getSuggestedQuestions()
      : [],
  };
}
