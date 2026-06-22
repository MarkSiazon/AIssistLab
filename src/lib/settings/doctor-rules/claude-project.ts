import {
  createDoctorCheck as check,
  type SetupDoctorCheck,
  type SetupDoctorInput,
} from "@/lib/settings/doctor-model";

export function buildClaudeProjectChecks(
  input: SetupDoctorInput,
): SetupDoctorCheck[] {
  if (!input.claudeProject) return [];

  return input.claudeProject.checks.map((projectCheck) =>
    check(
      projectCheck.id,
      "claude-project",
      projectCheck.title,
      projectCheck.status,
      projectCheck.message,
      ["WORKSPACE_ROOT"],
      projectCheck.suggestedFix,
    ),
  );
}
