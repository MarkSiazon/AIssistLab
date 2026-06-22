import {
  createDoctorCheck as check,
  type SetupDoctorCheck,
  type SetupDoctorInput,
} from "@/lib/settings/doctor-model";

export function buildWorkspaceChecks(
  input: SetupDoctorInput,
): SetupDoctorCheck[] {
  return [
    input.env.WORKSPACE_ROOT?.trim()
      ? input.paths.workspaceRoot.exists && input.paths.workspaceRoot.isDirectory
        ? check(
            "workspace-root",
            "workspace",
            "Workspace root",
            "ok",
            "WORKSPACE_ROOT points to an accessible folder.",
            ["WORKSPACE_ROOT"],
          )
        : check(
            "workspace-root",
            "workspace",
            "Workspace root",
            "error",
            "WORKSPACE_ROOT does not point to an accessible folder.",
            ["WORKSPACE_ROOT"],
            "Set WORKSPACE_ROOT to the folder that contains your Claude Code skills workspace.",
          )
      : check(
          "workspace-root",
          "workspace",
          "Workspace root",
          "error",
          "WORKSPACE_ROOT is not configured.",
          ["WORKSPACE_ROOT"],
          "Set WORKSPACE_ROOT to the folder that contains your Claude Code skills workspace.",
        ),
    input.env.SKILLS_DIR?.trim()
      ? input.paths.skillsDir.exists && input.paths.skillsDir.isDirectory
        ? check(
            "skills-dir",
            "workspace",
            "Skills directory",
            "ok",
            "SKILLS_DIR resolves to an accessible folder.",
            ["WORKSPACE_ROOT", "SKILLS_DIR"],
          )
        : check(
            "skills-dir",
            "workspace",
            "Skills directory",
            "error",
            "SKILLS_DIR does not resolve to an accessible folder.",
            ["WORKSPACE_ROOT", "SKILLS_DIR"],
            "Set SKILLS_DIR to the skills folder, usually .claude/skills relative to WORKSPACE_ROOT.",
          )
      : check(
          "skills-dir",
          "workspace",
          "Skills directory",
          "error",
          "SKILLS_DIR is not configured.",
          ["SKILLS_DIR"],
          "Set SKILLS_DIR to .claude/skills or another folder containing skill markdown files.",
        ),
  ];
}
