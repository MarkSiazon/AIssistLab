import type { SkillsImportSourceType } from "@/lib/ui/skills-import-panel-model";

interface SkillsImportSourceFieldsProps {
  sourceType: SkillsImportSourceType;
  folderPath: string;
  githubUrl: string;
  onSourceTypeChange: (value: SkillsImportSourceType) => void;
  onFolderPathChange: (value: string) => void;
  onGithubUrlChange: (value: string) => void;
  onArchiveFileChange: (file: File | null) => void;
}

const fieldInputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
  minHeight: "44px",
};

export function SkillsImportSourceFields({
  sourceType,
  folderPath,
  githubUrl,
  onSourceTypeChange,
  onFolderPathChange,
  onGithubUrlChange,
  onArchiveFileChange,
}: SkillsImportSourceFieldsProps) {
  return (
    <>
      <label htmlFor="skills-import-source" className="skills-form-label">
        Import source
      </label>
      <select
        id="skills-import-source"
        value={sourceType}
        onChange={(event) =>
          onSourceTypeChange(event.target.value as SkillsImportSourceType)
        }
        aria-describedby="skills-import-source-help"
        className="text-xs px-2 py-2 rounded border outline-none"
        style={fieldInputStyle}
      >
        <option value="folder">Local folder</option>
        <option value="archive">Zip archive</option>
        <option value="github">GitHub URL</option>
      </select>
      <div id="skills-import-source-help" className="skills-form-help">
        Preview validates the source first; nothing is written until Apply.
      </div>

      {sourceType === "folder" && (
        <div className="skills-form-field">
          <label htmlFor="skills-import-folder" className="skills-form-label">
            Folder path
          </label>
          <input
            id="skills-import-folder"
            value={folderPath}
            onChange={(event) => onFolderPathChange(event.target.value)}
            placeholder="C:\\path\\to\\skills"
            aria-describedby="skills-import-folder-help"
            className="text-xs px-2 py-2 rounded border outline-none"
            style={fieldInputStyle}
          />
          <div id="skills-import-folder-help" className="skills-form-help">
            Use a local folder containing skill Markdown files.
          </div>
        </div>
      )}

      {sourceType === "archive" && (
        <div className="skills-form-field">
          <label htmlFor="skills-import-archive" className="skills-form-label">
            Zip archive
          </label>
          <input
            id="skills-import-archive"
            type="file"
            accept=".zip"
            onChange={(event) =>
              onArchiveFileChange(event.target.files?.[0] ?? null)
            }
            aria-describedby="skills-import-archive-help"
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          />
          <div id="skills-import-archive-help" className="skills-form-help">
            Select a zip file to preview before importing.
          </div>
        </div>
      )}

      {sourceType === "github" && (
        <div className="skills-form-field">
          <label htmlFor="skills-import-github" className="skills-form-label">
            GitHub URL
          </label>
          <input
            id="skills-import-github"
            value={githubUrl}
            onChange={(event) => onGithubUrlChange(event.target.value)}
            placeholder="https://github.com/org/repo/tree/main/skills"
            aria-describedby="skills-import-github-help"
            className="text-xs px-2 py-2 rounded border outline-none"
            style={fieldInputStyle}
          />
          <div id="skills-import-github-help" className="skills-form-help">
            Use a public GitHub folder or archive URL for preview.
          </div>
        </div>
      )}
    </>
  );
}
