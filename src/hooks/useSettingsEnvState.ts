"use client";

import { useCallback, useMemo, useState } from "react";
import {
  fetchSettingsEnv,
  type SettingsEnvData,
} from "@/lib/settings/client-api";
import {
  applySettingsFieldValues,
  isSettingsSnapshotDirty,
  removeSettingsExtraField,
  splitSettingsEnvFields,
  updateSettingsExtraField,
  type SettingsKnownField,
  type SettingsSnapshot,
} from "@/lib/settings/env-fields";
import type { SettingsFieldType } from "@/lib/ui/settings-active-values-panel";
import { isSettingsPathValidationFieldType } from "@/lib/ui/settings-path-validation";

interface SettingsEnvPathValidator {
  (
    key: string,
    value: string,
    type: SettingsFieldType,
    workspaceRoot?: string,
  ): void;
}

export interface UseSettingsEnvStateOptions {
  knownFields: readonly (SettingsKnownField & { type: SettingsFieldType })[];
  defaultFieldValues: Record<string, string>;
  validatePath: SettingsEnvPathValidator;
  onLoadError?: (message: string) => void;
}

export function useSettingsEnvState({
  knownFields,
  defaultFieldValues,
  validatePath,
  onLoadError,
}: UseSettingsEnvStateOptions) {
  const [data, setData] = useState<SettingsEnvData | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [rawText, setRawText] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState<SettingsSnapshot | null>(
    null,
  );

  const settingsDirty = useMemo(() => {
    return isSettingsSnapshotDirty({
      snapshot: savedSnapshot,
      fields,
      extraFields,
      rawText,
    });
  }, [extraFields, fields, rawText, savedSnapshot]);

  const validateKnownFieldPaths = useCallback(
    (nextFields: Record<string, string>) => {
      for (const field of knownFields) {
        const value = nextFields[field.key];
        if (!isSettingsPathValidationFieldType(field.type) || !value) continue;
        validatePath(field.key, value, field.type, nextFields["WORKSPACE_ROOT"]);
      }
    },
    [knownFields, validatePath],
  );

  const loadSettings = useCallback(async () => {
    try {
      const envData = await fetchSettingsEnv();
      setData(envData);
      setRawText(envData.raw);

      const splitFields = splitSettingsEnvFields({
        parsed: envData.parsed,
        knownFields,
      });
      setFields(splitFields.fields);
      setExtraFields(splitFields.extraFields);
      setSavedSnapshot({
        fields: splitFields.fields,
        extraFields: splitFields.extraFields,
        rawText: envData.raw,
      });
      validateKnownFieldPaths(splitFields.fields);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Settings API is unavailable in this server context.";
      setData({ raw: "", parsed: {}, path: "" });
      setRawText("");
      setFields(defaultFieldValues);
      setExtraFields({});
      setSavedSnapshot(null);
      onLoadError?.(message);
    }
  }, [defaultFieldValues, knownFields, onLoadError, validateKnownFieldPaths]);

  const setFieldValue = useCallback(
    (key: string, value: string) => {
      setFields((prev) => {
        const next = applySettingsFieldValues({
          fields: prev,
          values: { [key]: value },
        });
        const field = knownFields.find((item) => item.key === key);
        if (field && isSettingsPathValidationFieldType(field.type)) {
          validatePath(key, value, field.type, next["WORKSPACE_ROOT"]);
        }
        return next;
      });
    },
    [knownFields, validatePath],
  );

  const applyFieldValues = useCallback(
    (values: Record<string, string>) => {
      setFields((prev) => {
        const next = applySettingsFieldValues({ fields: prev, values });
        validateKnownFieldPaths(next);
        return next;
      });
    },
    [validateKnownFieldPaths],
  );

  const addExtraField = useCallback(() => {
    setExtraFields((prev) => ({ ...prev, "": "" }));
  }, []);

  const updateExtraField = useCallback(
    (oldKey: string, newKey: string, value: string) => {
      setExtraFields((prev) =>
        updateSettingsExtraField({
          extraFields: prev,
          oldKey,
          newKey,
          value,
        }),
      );
    },
    [],
  );

  const removeExtraField = useCallback((key: string) => {
    setExtraFields((prev) =>
      removeSettingsExtraField({ extraFields: prev, key }),
    );
  }, []);

  const markFieldsSaved = useCallback(
    (nextRawText: string) => {
      setRawText(nextRawText);
      setSavedSnapshot({
        fields,
        extraFields,
        rawText: nextRawText,
      });
    },
    [extraFields, fields],
  );

  const applyRawSaveResult = useCallback(
    ({
      parsed,
      rawText: savedRawText,
    }: {
      parsed: Record<string, string>;
      rawText: string;
    }) => {
      const splitFields = splitSettingsEnvFields({
        parsed,
        knownFields,
      });
      setFields(splitFields.fields);
      setExtraFields(splitFields.extraFields);
      setSavedSnapshot({
        fields: splitFields.fields,
        extraFields: splitFields.extraFields,
        rawText: savedRawText,
      });
    },
    [knownFields],
  );

  return {
    data,
    fields,
    extraFields,
    rawText,
    settingsDirty,
    loadSettings,
    setRawText,
    setFieldValue,
    applyFieldValues,
    addExtraField,
    updateExtraField,
    removeExtraField,
    markFieldsSaved,
    applyRawSaveResult,
  };
}
