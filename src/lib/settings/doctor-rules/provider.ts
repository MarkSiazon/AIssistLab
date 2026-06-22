import type { LlmProvider } from "@/lib/rag/llm-types";
import {
  createDoctorCheck as check,
  isPlaceholderApiKey,
  type SetupDoctorCheck,
  type SetupDoctorInput,
} from "@/lib/settings/doctor-model";

export function buildProviderChecks({
  input,
  provider,
  localCliEnabled,
}: {
  input: SetupDoctorInput;
  provider: LlmProvider;
  localCliEnabled: boolean;
}): SetupDoctorCheck[] {
  const checks: SetupDoctorCheck[] = [];

  if (provider === "anthropic_api") {
    checks.push(
      isPlaceholderApiKey(input.env.ANTHROPIC_API_KEY)
        ? check(
            "anthropic-api-key",
            "provider",
            "Anthropic API provider",
            "error",
            "LLM_PROVIDER is anthropic_api but ANTHROPIC_API_KEY is not configured.",
            ["LLM_PROVIDER", "ANTHROPIC_API_KEY"],
            "Add a valid ANTHROPIC_API_KEY, or switch LLM_PROVIDER to claude_code_cli for local CLI mode.",
          )
        : check(
            "anthropic-api-key",
            "provider",
            "Anthropic API provider",
            "ok",
            "API-key provider is selected and an API key is configured.",
            ["LLM_PROVIDER", "ANTHROPIC_API_KEY"],
          ),
    );
  } else {
    checks.push(
      localCliEnabled
        ? check(
            "cli-mode-enabled",
            "provider",
            "Claude CLI provider",
            "ok",
            "Local Claude CLI provider is selected and enabled.",
            ["LLM_PROVIDER", "ENABLE_LOCAL_CLAUDE_CLI"],
          )
        : check(
            "cli-mode-enabled",
            "provider",
            "Claude CLI provider",
            "error",
            "LLM_PROVIDER is claude_code_cli but local CLI calls are disabled.",
            ["LLM_PROVIDER", "ENABLE_LOCAL_CLAUDE_CLI"],
            "Set ENABLE_LOCAL_CLAUDE_CLI=true, then restart the dev server.",
          ),
    );
  }

  if (provider === "anthropic_api" && localCliEnabled) {
    checks.push(
      check(
        "unused-cli-enabled",
        "provider",
        "Unused CLI enable flag",
        "warn",
        "ENABLE_LOCAL_CLAUDE_CLI is true, but LLM_PROVIDER is anthropic_api.",
        ["LLM_PROVIDER", "ENABLE_LOCAL_CLAUDE_CLI"],
        "Set ENABLE_LOCAL_CLAUDE_CLI=false unless you are switching to LLM_PROVIDER=claude_code_cli.",
      ),
    );
  }

  return checks;
}
