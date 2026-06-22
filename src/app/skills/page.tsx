"use client";

import { SkillLibraryReadinessPanel } from "@/components/skills/SkillLibraryReadinessPanel";
import { SkillPreviewPane } from "@/components/skills/SkillPreviewPane";
import { SkillsImportPanel } from "@/components/skills/SkillsImportPanel";
import { SkillsListContent } from "@/components/skills/SkillsListContent";
import { SkillsListHeader } from "@/components/skills/SkillsListHeader";
import { SkillsSearchBox } from "@/components/skills/SkillsSearchBox";
import { useSkillsPageController } from "@/hooks/useSkillsPageController";

export default function SkillsPage() {
  const controller = useSkillsPageController();
  const { list, readiness, importPanel, previewPane } = controller;

  return (
    <div className="skills-shell">
      <div
        className="skills-list-pane"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <SkillsListHeader total={list.data?.total ?? null} />

        <SkillsSearchBox value={list.search} onChange={list.setSearch} />

        <SkillLibraryReadinessPanel
          readiness={readiness.libraryReadiness}
          qualitySummary={readiness.qualitySummary}
          topQualityIssues={readiness.topQualityIssues}
          indexStatus={readiness.indexStatus}
          indexRebuilding={readiness.indexRebuilding}
          onRefresh={readiness.refreshLibraryState}
          onRebuildIndex={readiness.rebuildIndexFromSkills}
        />

        <SkillsImportPanel
          latestDeleted={importPanel.latestDeleted}
          restoreAction={importPanel.restoreAction}
          sourceType={importPanel.sourceType}
          folderPath={importPanel.folderPath}
          githubUrl={importPanel.githubUrl}
          previewAction={importPanel.previewAction}
          preview={importPanel.preview}
          previewSummary={importPanel.previewSummary}
          visiblePreviewSkills={importPanel.visiblePreviewSkills}
          validCount={importPanel.validCount}
          invalidCount={importPanel.invalidCount}
          duplicateCount={importPanel.duplicateCount}
          warningCount={importPanel.warningCount}
          duplicateStrategy={importPanel.duplicateStrategy}
          overwriteConfirmText={importPanel.overwriteConfirmText}
          importAction={importPanel.importAction}
          lifecycleMessage={importPanel.lifecycleMessage}
          onRestoreLatestDeleted={importPanel.restoreLatestDeleted}
          onSourceTypeChange={importPanel.setSourceType}
          onFolderPathChange={importPanel.setFolderPath}
          onGithubUrlChange={importPanel.setGithubUrl}
          onArchiveFileChange={importPanel.handleArchiveFile}
          onPreviewImport={importPanel.previewImport}
          onDuplicateStrategyChange={importPanel.setDuplicateStrategy}
          onOverwriteConfirmTextChange={importPanel.setOverwriteConfirmText}
          onApplyImport={importPanel.applyImport}
        />

        <SkillsListContent
          skills={list.filtered}
          selectedName={previewPane.selectedName}
          isLoading={list.isLoading}
          error={list.error}
          hasSearch={list.hasSearch}
          emptyTitle={list.emptyState.title}
          emptyMessage={list.emptyState.message}
          onSelectSkill={list.selectSkill}
          onClearSearch={() => list.setSearch("")}
        />
      </div>

      <SkillPreviewPane
        selectedName={previewPane.selectedName}
        preview={previewPane.preview}
        previewLoading={previewPane.previewLoading}
        deleteConfirm={previewPane.deleteConfirm}
        deleteTypedName={previewPane.deleteTypedName}
        deleteLoading={previewPane.deleteLoading}
        deleteAction={previewPane.deleteAction}
        deleteInputRef={previewPane.deleteInputRef}
        onDeleteTypedNameChange={previewPane.setDeleteTypedName}
        onRequestDelete={previewPane.requestDelete}
        onConfirmDelete={previewPane.confirmDelete}
        onCancelDelete={previewPane.cancelDelete}
      />
    </div>
  );
}
