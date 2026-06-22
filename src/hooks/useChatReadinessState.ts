"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchChatReleaseReadiness,
  fetchChatStatus,
  type ChatStatus,
  type ReleaseReadinessSummary,
} from "@/lib/chat/client-api";

export function useChatReadinessState() {
  const [chatStatus, setChatStatus] = useState<ChatStatus | null>(null);
  const [chatStatusError, setChatStatusError] = useState<string | null>(null);
  const [releaseReadiness, setReleaseReadiness] =
    useState<ReleaseReadinessSummary | null>(null);

  const loadChatStatus = useCallback(async () => {
    try {
      setChatStatus(await fetchChatStatus());
      setChatStatusError(null);
    } catch (err) {
      setChatStatus(null);
      setChatStatusError(
        err instanceof Error ? err.message : "Unable to load chat status",
      );
    }
  }, []);

  const loadReleaseReadiness = useCallback(async () => {
    try {
      setReleaseReadiness(await fetchChatReleaseReadiness());
    } catch {
      setReleaseReadiness(null);
    }
  }, []);

  useEffect(() => {
    loadChatStatus();
    loadReleaseReadiness();
  }, [loadChatStatus, loadReleaseReadiness]);

  return {
    chatStatus,
    chatStatusError,
    releaseReadiness,
    loadChatStatus,
    loadReleaseReadiness,
  };
}
