"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import {
  getEditorTabForKey,
  isEditorTabNavigationKey,
  type EditorTabId,
} from "@/lib/ui/editor-tab-navigation";

export function useSkillEditorTabs(initialTab: EditorTabId = "edit") {
  const [activeTab, setActiveTab] = useState<EditorTabId>(initialTab);
  const editTabButtonRef = useRef<HTMLButtonElement | null>(null);
  const previewTabButtonRef = useRef<HTMLButtonElement | null>(null);

  function focusEditorTab(tab: EditorTabId) {
    const tabRef = tab === "edit" ? editTabButtonRef : previewTabButtonRef;
    window.requestAnimationFrame(() => tabRef.current?.focus());
  }

  function handleEditorTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isEditorTabNavigationKey(event.key)) return;
    event.preventDefault();
    const nextTab = getEditorTabForKey({
      current: activeTab,
      key: event.key,
    });
    setActiveTab(nextTab);
    focusEditorTab(nextTab);
  }

  return {
    activeTab,
    setActiveTab,
    editTabButtonRef,
    previewTabButtonRef,
    handleEditorTabKeyDown,
  };
}
