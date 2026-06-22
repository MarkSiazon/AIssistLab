"use client";

import { useCallback, useState } from "react";
import { rebuildChatIndex } from "@/lib/chat/client-api";

interface ChatIndexRebuildInput {
  loadChatStatus: () => Promise<void>;
  loadReleaseReadiness: () => Promise<void>;
}

export function useChatIndexRebuild({
  loadChatStatus,
  loadReleaseReadiness,
}: ChatIndexRebuildInput) {
  const [rebuilding, setRebuilding] = useState(false);

  const rebuildIndex = useCallback(async () => {
    setRebuilding(true);
    try {
      await rebuildChatIndex();
      await loadChatStatus();
      await loadReleaseReadiness();
    } finally {
      setRebuilding(false);
    }
  }, [loadChatStatus, loadReleaseReadiness]);

  return {
    rebuilding,
    rebuildIndex,
  };
}
