import {
  createDoctorCheck as check,
  findRuntimeDrift,
  KNOWN_RUNTIME_KEYS,
  type SetupDoctorCheck,
  type SetupDoctorInput,
} from "@/lib/settings/doctor-model";

export function buildRuntimeDriftChecks(
  input: SetupDoctorInput,
): SetupDoctorCheck[] {
  const driftKeys = findRuntimeDrift(
    input.env,
    input.runtimeEnv,
    input.activeProviderEnv,
  );

  return [
    driftKeys.length > 0
      ? check(
          "runtime-env-sync",
          "provider",
          "Restart required",
          "warn",
          "Saved .env.local values differ from the running server environment.",
          driftKeys,
          "Restart the dev server so saved environment changes take effect.",
        )
      : check(
          "runtime-env-sync",
          "provider",
          "Runtime env",
          "ok",
          "Known .env.local values match the running server environment.",
          KNOWN_RUNTIME_KEYS,
        ),
  ];
}
