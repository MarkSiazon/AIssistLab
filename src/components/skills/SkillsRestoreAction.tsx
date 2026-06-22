import type { SkillRestoreActionState } from "@/lib/ui/skill-restore-action";
import type { DeletedSkillSummary } from "@/lib/ui/skills-import-panel-model";

interface SkillsRestoreActionProps {
  latestDeleted?: DeletedSkillSummary | null;
  restoreAction: SkillRestoreActionState;
  onRestoreLatestDeleted: () => void;
}

export function SkillsRestoreAction({
  latestDeleted,
  restoreAction,
  onRestoreLatestDeleted,
}: SkillsRestoreActionProps) {
  if (!latestDeleted) return null;

  return (
    <div className="skills-restore-action">
      <div className="skills-restore-copy">
        <span className="skills-restore-status">
          {restoreAction.statusLabel}
        </span>
        <span id="skills-restore-help" className="skills-form-help">
          {restoreAction.helpText}
        </span>
      </div>
      <button
        type="button"
        onClick={onRestoreLatestDeleted}
        disabled={!restoreAction.canRestore}
        aria-label={restoreAction.ariaLabel}
        aria-describedby="skills-restore-help"
        title={restoreAction.helpText}
        className="ui-button ui-button-secondary text-xs"
      >
        {restoreAction.buttonLabel}
      </button>
    </div>
  );
}
