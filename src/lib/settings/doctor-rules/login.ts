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
          "Keep CLAUDE_LOGIN_COMMAND=auto for built-in auth, or set CLAUDE_LOGIN_COMMAND=claude-login only if you intentionally use a custom helper.",
        ),
  ];
}
