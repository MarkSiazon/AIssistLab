"use client";

import { useCallback, useState } from "react";
import {
  fetchChatReadiness,
  fetchDoctorReport,
  fetchIndexStatus,
  fetchReleaseReadiness,
  fetchRuntimeStatus,
  fetchSkillQualityReport,
  rebuildRagIndex,
  type ActiveRuntimeProviderStatus,
  type ReleaseReadinessReport,
} from "@/lib/settings/client-api";
import type { PublicIndexState } from "@/lib/rag/index-state";
import type { SetupDoctorReport } from "@/lib/settings/doctor";
import type { FirstRunChatStatus } from "@/lib/settings/first-run-checklist";
import type { SkillQualityReport } from "@/lib/skills/quality";

export function useSettingsReadinessState() {
  const [indexStatus, setIndexStatus] = useState<PublicIndexState | null>(null);
  const [indexRebuilding, setIndexRebuilding] = useState(false);
  const [qualityReport, setQualityReport] =
    useState<SkillQualityReport | null>(null);
  const [activeRuntime, setActiveRuntime] =
    useState<ActiveRuntimeProviderStatus | null>(null);
  const [chatReadiness, setChatReadiness] =
    useState<FirstRunChatStatus | null>(null);
  const [doctorReport, setDoctorReport] = useState<SetupDoctorReport | null>(
    null,
  );
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [releaseReadiness, setReleaseReadiness] =
    useState<ReleaseReadinessReport | null>(null);

  const loadRuntimeStatus = useCallback(async () => {
    try {
      setActiveRuntime(await fetchRuntimeStatus());
    } catch {
      setActiveRuntime(null);
    }
  }, []);

  const loadChatReadiness = useCallback(async () => {
    try {
      setChatReadiness(await fetchChatReadiness());
    } catch {
      setChatReadiness(null);
    }
  }, []);

  const loadIndexStatus = useCallback(async () => {
    try {
      setIndexStatus(await fetchIndexStatus());
    } catch {
      setIndexStatus(null);
    }
  }, []);

  const loadQualityReport = useCallback(async () => {
    try {
      setQualityReport(await fetchSkillQualityReport());
    } catch {
      setQualityReport(null);
    }
  }, []);

  const loadReleaseReadiness = useCallback(async () => {
    try {
      setReleaseReadiness(await fetchReleaseReadiness());
    } catch {
      setReleaseReadiness(null);
    }
  }, []);

  const loadDoctorReport = useCallback(async () => {
    setDoctorLoading(true);
    try {
      setDoctorReport(await fetchDoctorReport());
    } catch {
      setDoctorReport(null);
    } finally {
      setDoctorLoading(false);
    }
  }, []);

  const rebuildIndex = useCallback(async () => {
    setIndexRebuilding(true);
    try {
      const data = await rebuildRagIndex();
      setIndexStatus(data);
      return data;
    } finally {
      setIndexRebuilding(false);
    }
  }, []);

  return {
    indexStatus,
    indexRebuilding,
    qualityReport,
    activeRuntime,
    chatReadiness,
    doctorReport,
    doctorLoading,
    releaseReadiness,
    setActiveRuntime,
    loadRuntimeStatus,
    loadChatReadiness,
    loadIndexStatus,
    loadQualityReport,
    loadReleaseReadiness,
    loadDoctorReport,
    rebuildIndex,
  };
}
