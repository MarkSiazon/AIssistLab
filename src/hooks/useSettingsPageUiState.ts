"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SettingsStatusMessage } from "@/components/settings/SettingsStatusBanner";
import type { SettingsTab } from "@/components/settings/SettingsTabs";
import { isDiagnosticsExportedThisSession } from "@/lib/ui/diagnostics-export-session";

export function useSettingsPageUiState() {
  const [tab, setTab] = useState<SettingsTab>("fields");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SettingsStatusMessage | null>(null);
  const [diagnosticsExported, setDiagnosticsExported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDiagnosticsExported(isDiagnosticsExportedThisSession());
  }, []);

  const handleSettingsLoadError = useCallback((message: string) => {
    setStatus({
      type: "error",
      msg: message,
    });
  }, []);

  const openFileImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    tab,
    setTab,
    saving,
    setSaving,
    status,
    setStatus,
    diagnosticsExported,
    setDiagnosticsExported,
    fileInputRef,
    handleSettingsLoadError,
    openFileImport,
  };
}
