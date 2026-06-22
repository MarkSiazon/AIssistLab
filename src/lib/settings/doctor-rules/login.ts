import {
  createDoctorCheck as check,
  type SetupDoctorCheck,
  type SetupDoctorInput,
} from "@/lib/settings/doctor-model";

export function buildLoginChecks(input: SetupDoctorInput): SetupDoctorCheck[] {
  return [
    input.claude.loginHelperAvailable
      ? check(
          "login-helper",
          "login",
          "Claude login helper",
          "ok",
          "The configured Claude login helper is available.",
          ["CLAUDE_LOGIN_COMMAND"],
        )
      : check(
          "login-helper",
          "login",
          "Claude login helper",
          "warn",
          input.claude.canOpenLogin
            ? "No optional Claude login helper was found; Settings can use Claude Code's built-in auth login instead."
            : "No optional Claude login helper was found, and Claude Code auth login is not available.",
          ["CLAUDE_LOGIN_COMMAND"],
          "Set CLAUDE_LOGIN_COMMAND=auto, or install a claude-login helper if you need profile switching shortcuts.",
        ),
  ];
}
