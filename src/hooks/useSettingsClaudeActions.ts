"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SettingsStatusMessage } from "@/components/settings/SettingsStatusBanner";
import {
  openClaudeLogin as openClaudeLoginRequest,
  testClaudeCli as testClaudeCliRequest,
  type ClaudeCliTestResult,
  type ClaudeProfileSelectionPayload,
} from "@/lib/settings/client-api";
import {
  runSettingsRefreshPlan,
  type SettingsRefreshActions,
} from "@/lib/ui/settings-refresh-plan";

interface SettingsClaudeActionsInput {
  fields: Record<string, string>;
  refreshActions: SettingsRefreshActions;
  buildClaudeProfileSelection: (
    fields: Record<string, string>,
  ) => ClaudeProfileSelectionPayload;
  currentProfileSelectionKey: (fields: Record<string, string>) => string;
  setStatus: Dispatch<SetStateAction<SettingsStatusMessage | null>>;
  setClaudeActionLoading: Dispatch<SetStateAction<boolean>>;
  setClaudeTestLoading: Dispatch<SetStateAction<boolean>>;
  setClaudeTestResult: Dispatch<SetStateAction<ClaudeCliTestResult | null>>;
  setClaudeTestSelectionKey: Dispatch<SetStateAction<string | null>>;
}

export function useSettingsClaudeActions({
  fields,
  refreshActions,
  buildClaudeProfileSelection,
  currentProfileSelectionKey,
  setStatus,
  setClaudeActionLoading,
  setClaudeTestLoading,
  setClaudeTestResult,
  setClaudeTestSelectionKey,
}: SettingsClaudeActionsInput) {
  async function openClaudeLogin() {
    setClaudeActionLoading(true);
    setStatus(null);
    try {
      const data = await openClaudeLoginRequest({
        profileSelection: buildClaudeProfileSelection(fields),
      });
      setStatus({
        type: "success",
        msg: `Opened ${data.loginCommand}.`,
      });
      runSettingsRefreshPlan("after-claude-login", refreshActions);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setClaudeActionLoading(false);
    }
  }

  async function testClaudeCli() {
    setClaudeTestLoading(true);
    setStatus(null);
    try {
      const data = await testClaudeCliRequest({
        profileSelection: buildClaudeProfileSelection(fields),
      });
      setClaudeTestResult(data);
      setClaudeTestSelectionKey(currentProfileSelectionKey(fields));
      setStatus({
        type: data.ok ? "success" : "error",
        msg: data.ok
          ? "Claude CLI test passed."
          : data.error ?? "Claude CLI test failed.",
      });
      runSettingsRefreshPlan("after-cli-test-success", refreshActions);
    } catch (err) {
      const result: ClaudeCliTestResult = {
        checked: true,
        ok: false,
        output: null,
        error: err instanceof Error ? err.message : "Unknown error",
      };
      setClaudeTestResult(result);
      setStatus({
        type: "error",
        msg: result.error ?? "Claude CLI test failed.",
      });
      runSettingsRefreshPlan("after-cli-test-failure", refreshActions);
    } finally {
      setClaudeTestLoading(false);
    }
  }

  return {
    openClaudeLogin,
    testClaudeCli,
  };
}
