import type { SkillsImportActionState } from "@/lib/ui/skills-import-action";
import type { SkillsImportDuplicateStrategy } from "@/lib/ui/skills-import-panel-model";

interface SkillsImportDuplicateControlsProps {
  duplicateStrategy: SkillsImportDuplicateStrategy;
  overwriteConfirmText: string;
  importAction: SkillsImportActionState;
  onDuplicateStrategyChange: (value: SkillsImportDuplicateStrategy) => void;
  onOverwriteConfirmTextChange: (value: string) => void;
  onApplyImport: () => void;
}

export function SkillsImportDuplicateControls({
  duplicateStrategy,
  overwriteConfirmText,
  importAction,
  onDuplicateStrategyChange,
  onOverwriteConfirmTextChange,
  onApplyImport,
}: SkillsImportDuplicateControlsProps) {
  return (
    <>
      <label
        htmlFor="skills-duplicate-strategy"
        className="skills-form-label mt-2"
      >
        Duplicate handling
      </label>
      <select
        id="skills-duplicate-strategy"
        value={duplicateStrategy}
        onChange={(event) =>
          onDuplicateStrategyChange(
            event.target.value as SkillsImportDuplicateStrategy,
          )
        }
        aria-describedby="skills-duplicate-strategy-help"
        className="text-xs mt-2 px-2 py-2 rounded border outline-none w-full"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
          minHeight: "44px",
        }}
      >
        <option value="skip">Skip duplicates</option>
        <option value="rename">Rename duplicates</option>
        <option value="overwrite">Overwrite duplicates</option>
      </select>
      <div id="skills-duplicate-strategy-help" className="skills-form-help">
        Overwrite requires a typed confirmation before Apply is enabled.
      </div>

      {importAction.requiresOverwriteConfirmation && (
        <div className="mt-2 flex flex-col gap-1">
          <label
            htmlFor="skills-overwrite-confirm"
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Type overwrite to replace existing duplicate skills.
          </label>
          <input
            id="skills-overwrite-confirm"
            value={overwriteConfirmText}
            onChange={(event) =>
              onOverwriteConfirmTextChange(event.target.value)
            }
            placeholder="overwrite"
            aria-describedby="skills-overwrite-confirm-help"
            className="text-xs px-2 py-2 rounded border outline-none"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
              minHeight: "44px",
            }}
          />
          <div id="skills-overwrite-confirm-help" className="skills-form-help">
            Existing duplicate skill files will be replaced if applied.
          </div>
        </div>
      )}

      {importAction.blocker && (
        <div
          id="skills-import-apply-blocker"
          className="skills-import-blocker"
          role="status"
        >
          {importAction.blocker}
        </div>
      )}
      <button
        type="button"
        onClick={onApplyImport}
        disabled={!importAction.canApply}
        aria-describedby={
          importAction.blocker ? "skills-import-apply-blocker" : undefined
        }
        className="ui-button ui-button-primary skills-import-apply text-xs"
      >
        {importAction.buttonLabel}
      </button>
    </>
  );
}
