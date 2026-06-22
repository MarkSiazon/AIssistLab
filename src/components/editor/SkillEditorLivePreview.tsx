"use client";

import { SkillFrontmatterPreview } from "@/components/editor/SkillFrontmatterPreview";
import { SkillMarkdownPreview } from "@/components/editor/SkillMarkdownPreview";
import type { SkillValidationError } from "@/lib/ui/skill-editor-model";

interface SkillEditorLivePreviewProps {
  description: string;
  tags: string[];
  body: string;
  bodyError?: SkillValidationError;
}

export function SkillEditorLivePreview({
  description,
  tags,
  body,
  bodyError,
}: SkillEditorLivePreviewProps) {
  return (
    <div className="skill-editor-pane">
      <div className="skill-editor-live-header">Live Preview</div>
      <div className="skill-editor-preview-scroll">
        <SkillFrontmatterPreview description={description} tags={tags} />
        {bodyError && (
          <div
            className="skill-editor-body-error"
          >
            {bodyError.message}
          </div>
        )}
        <SkillMarkdownPreview body={body} />
      </div>
    </div>
  );
}
