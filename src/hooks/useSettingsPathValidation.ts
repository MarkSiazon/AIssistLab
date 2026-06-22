"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkSettingsPath,
  type SettingsFetcher,
} from "@/lib/settings/client-api";
import type { SettingsFieldType } from "@/lib/ui/settings-active-values-panel";
import {
  resolveSettingsPathForValidation,
  SETTINGS_PATH_VALIDATION_DELAY_MS,
  settingsPathStateForValidationResult,
} from "@/lib/ui/settings-path-validation";
import type { SettingsPathState } from "@/lib/ui/settings-status";

export interface UseSettingsPathValidationOptions {
  delayMs?: number;
  fetcher?: SettingsFetcher;
}

export function useSettingsPathValidation({
  delayMs = SETTINGS_PATH_VALIDATION_DELAY_MS,
  fetcher = fetch,
}: UseSettingsPathValidationOptions = {}) {
  const [pathStates, setPathStates] = useState<
    Record<string, SettingsPathState>
  >({});
  const validationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const clearValidationTimer = useCallback((key: string) => {
    const timer = validationTimers.current[key];
    if (!timer) return;
    clearTimeout(timer);
    delete validationTimers.current[key];
  }, []);

  const validatePath = useCallback(
    (
      key: string,
      value: string,
      type: SettingsFieldType,
      workspaceRoot?: string,
    ) => {
      clearValidationTimer(key);

      if (!value.trim()) {
        setPathStates((prev) => ({ ...prev, [key]: "idle" }));
        return;
      }

      setPathStates((prev) => ({ ...prev, [key]: "checking" }));

      validationTimers.current[key] = setTimeout(async () => {
        try {
          const result = await checkSettingsPath(
            fetcher,
            resolveSettingsPathForValidation({
              value,
              type,
              workspaceRoot,
            }),
          );
          setPathStates((prev) => ({
            ...prev,
            [key]: settingsPathStateForValidationResult(result),
          }));
        } catch {
          setPathStates((prev) => ({ ...prev, [key]: "error" }));
        } finally {
          delete validationTimers.current[key];
        }
      }, delayMs);
    },
    [clearValidationTimer, delayMs, fetcher],
  );

  useEffect(() => {
    return () => {
      for (const timer of Object.values(validationTimers.current)) {
        clearTimeout(timer);
      }
      validationTimers.current = {};
    };
  }, []);

  return {
    pathStates,
    validatePath,
  };
}
