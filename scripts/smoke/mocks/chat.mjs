export function buildMockChatStreamBody({
  skillName = "release-readiness-smoke",
  section = "1-8",
  score = 0.91,
  preview,
  textChunks = [],
  errorMessage = null,
}) {
  const citations = {
    type: "citations",
    sources: [
      {
        skillName,
        section,
        score,
        preview,
      },
    ],
  };
  const events = [citations];

  if (errorMessage) {
    events.push({ type: "error", message: errorMessage });
  } else {
    for (const text of textChunks) {
      events.push({ type: "text", text });
    }
  }

  return [...events.map((event) => JSON.stringify(event)), ""].join("\n");
}

export function buildMockChatStatusPayload({
  suggestedQuestions = [],
  suggestedAction = null,
  indexStatus = "ready",
  skillCount = 1,
  chunkCount = 2,
  staleReason = null,
  error = null,
} = {}) {
  return {
    provider: "anthropic_api",
    runtimeSource: "runtime",
    canSend: true,
    blockingReason: null,
    suggestedAction,
    claudeCliEnabled: false,
    suggestedQuestions,
    index: {
      status: indexStatus,
      skillCount,
      chunkCount,
      staleReason,
      error,
    },
    lastCliSmokeTest: null,
  };
}
