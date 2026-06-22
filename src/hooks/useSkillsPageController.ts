"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  buildSkillLibraryReadiness,
  type SkillLibraryIndexState,
  type SkillLibraryQualityReport,
} from "@/lib/skills/library-readiness";
import {
  deleteSkillByName,
  fetchSkillBody,
  fetchSkillsJson,
  rebuildSkillsIndex,
  type SkillsListResponse,
} from "@/lib/skills/client-api";
import { useSkillsImportController } from "@/hooks/useSkillsImportController";
import { buildSkillDeleteActionState } from "@/lib/ui/skill-delete-action";
import { buildSkillQualitySummary } from "@/lib/ui/skills-library-readiness-panel";
import {
  buildIndexRebuiltMessage,
  filterSkills,
  getSkillsEmptyStateCopy,
} from "@/lib/ui/skills-page-model";

export function useSkillsPageController() {
  const { data, isLoading, error } = useSWR<SkillsListResponse>(
    "/api/skills",
    fetchSkillsJson,
  );
  const { data: indexStatus, mutate: refreshIndexStatus } =
    useSWR<SkillLibraryIndexState>("/api/index", fetchSkillsJson);
  const { data: qualityReport, mutate: refreshQualityReport } =
    useSWR<SkillLibraryQualityReport>(
      "/api/skills/validation",
      fetchSkillsJson,
    );

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteTypedName, setDeleteTypedName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [indexRebuilding, setIndexRebuilding] = useState(false);
  const [lifecycleMessage, setLifecycleMessage] = useState<string | null>(null);
  const deleteInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (deleteConfirm && deleteConfirm === selectedName) {
      deleteInputRef.current?.focus();
    }
  }, [deleteConfirm, selectedName]);

  const filtered = useMemo(
    () => filterSkills(data?.skills, search),
    [data?.skills, search],
  );
  const hasSearch = search.trim().length > 0;
  const skillsEmptyState = getSkillsEmptyStateCopy(hasSearch);

  const libraryReadiness = useMemo(
    () =>
      buildSkillLibraryReadiness({
        totalSkills: typeof data?.total === "number" ? data.total : null,
        skillsStatus: error ? "error" : data ? "ready" : "loading",
        skillsError: error instanceof Error ? error.message : null,
        indexStatus: indexStatus ?? null,
        qualityReport: qualityReport ?? null,
      }),
    [data, error, indexStatus, qualityReport],
  );

  const topQualityIssues = qualityReport?.issues.slice(0, 3) ?? [];
  const qualitySummary = buildSkillQualitySummary(qualityReport);

  const deleteAction = selectedName
    ? buildSkillDeleteActionState({
        skillName: selectedName,
        typedName: deleteTypedName,
        deleting: deleteLoading,
      })
    : null;

  async function refreshLibraryState() {
    await Promise.all([
      mutate("/api/skills"),
      refreshQualityReport(),
      refreshIndexStatus(),
    ]);
  }

  async function rebuildIndexFromSkills() {
    setIndexRebuilding(true);
    setLifecycleMessage(null);
    try {
      const payload = await rebuildSkillsIndex();
      await refreshIndexStatus(payload, { revalidate: false });
      setLifecycleMessage(buildIndexRebuiltMessage(payload));
    } catch (err) {
      setLifecycleMessage(
        err instanceof Error ? err.message : "Index rebuild failed.",
      );
    } finally {
      setIndexRebuilding(false);
    }
  }

  async function selectSkill(name: string) {
    setSelectedName(name);
    setPreviewLoading(true);
    setPreview(null);
    try {
      setPreview(await fetchSkillBody(name));
    } catch (err) {
      setPreview(err instanceof Error ? err.message : "Unable to load preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function deleteSkill(name: string) {
    setDeleteLoading(true);
    try {
      await deleteSkillByName(name);
      setDeleteConfirm(null);
      setDeleteTypedName("");
      if (selectedName === name) {
        setSelectedName(null);
        setPreview(null);
      }
      await refreshLibraryState();
      setLifecycleMessage("Deleted skill moved to local backup. Index marked stale.");
    } catch (err) {
      setLifecycleMessage(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const importPanel = useSkillsImportController({
    latestDeleted: data?.latestDeleted,
    lifecycleMessage,
    setLifecycleMessage,
    refreshLibraryState,
    selectSkill,
  });

  return {
    list: {
      data,
      isLoading,
      error,
      search,
      setSearch,
      filtered,
      hasSearch,
      emptyState: skillsEmptyState,
      selectSkill,
    },
    readiness: {
      libraryReadiness,
      qualitySummary,
      topQualityIssues,
      indexStatus,
      indexRebuilding,
      refreshLibraryState,
      rebuildIndexFromSkills,
    },
    importPanel,
    previewPane: {
      selectedName,
      preview,
      previewLoading,
      deleteConfirm,
      deleteTypedName,
      deleteLoading,
      deleteAction,
      deleteInputRef,
      setDeleteTypedName,
      requestDelete: (name: string) => {
        setDeleteConfirm(name);
        setDeleteTypedName("");
      },
      confirmDelete: deleteSkill,
      cancelDelete: () => {
        setDeleteConfirm(null);
        setDeleteTypedName("");
      },
    },
  };
}
