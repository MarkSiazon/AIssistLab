import { buildClaudeCliChecks } from "@/lib/settings/doctor-rules/claude-cli";
import { buildClaudeProjectChecks } from "@/lib/settings/doctor-rules/claude-project";
import { buildLoginChecks } from "@/lib/settings/doctor-rules/login";
import { buildProviderChecks } from "@/lib/settings/doctor-rules/provider";
import { buildRagIndexChecks } from "@/lib/settings/doctor-rules/rag-index";
import { buildRuntimeDriftChecks } from "@/lib/settings/doctor-rules/runtime-drift";
import { buildWorkspaceChecks } from "@/lib/settings/doctor-rules/workspace";
import {
  providerFromEnv,
  sanitizeClaudeProjectInventory,
  summarizeDoctorChecks,
  type SetupDoctorCheck,
  type SetupDoctorInput,
  type SetupDoctorReport,
} from "@/lib/settings/doctor-model";

export type {
  DoctorCheckGroup,
  DoctorCheckStatus,
  SetupDoctorCheck,
  SetupDoctorInput,
  SetupDoctorReport,
} from "@/lib/settings/doctor-model";

export function buildSetupDoctorReport(
  input: SetupDoctorInput,
): SetupDoctorReport {
  const provider = input.claude.provider ?? providerFromEnv(input.env);
  const localCliEnabled =
    input.claude.enabled ?? input.env.ENABLE_LOCAL_CLAUDE_CLI === "true";
  const checks: SetupDoctorCheck[] = [
    ...buildWorkspaceChecks(input),
    ...buildClaudeProjectChecks(input),
    ...buildRagIndexChecks(input),
    ...buildProviderChecks({
      input,
      provider,
      localCliEnabled,
    }),
    ...buildClaudeCliChecks({
      input,
      provider,
    }),
    ...buildLoginChecks(input),
    ...buildRuntimeDriftChecks(input),
  ];

  return {
    summary: summarizeDoctorChecks(checks),
    checks,
    claudeProject: sanitizeClaudeProjectInventory(input.claudeProject),
  };
}
