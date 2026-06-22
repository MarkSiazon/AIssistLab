export type EditorTabId = "edit" | "preview";

const EDITOR_TABS: EditorTabId[] = ["edit", "preview"];
const NAVIGATION_KEYS = new Set([
  "ArrowLeft",
  "ArrowUp",
  "ArrowRight",
  "ArrowDown",
  "Home",
  "End",
]);

export function isEditorTabNavigationKey(key: string): boolean {
  return NAVIGATION_KEYS.has(key);
}

export function getEditorTabForKey({
  current,
  key,
}: {
  current: EditorTabId;
  key: string;
}): EditorTabId {
  const currentIndex = EDITOR_TABS.indexOf(current);
  if (key === "Home") return EDITOR_TABS[0];
  if (key === "End") return EDITOR_TABS[EDITOR_TABS.length - 1];
  if (key === "ArrowRight" || key === "ArrowDown") {
    return EDITOR_TABS[(currentIndex + 1) % EDITOR_TABS.length];
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return EDITOR_TABS[
      (currentIndex - 1 + EDITOR_TABS.length) % EDITOR_TABS.length
    ];
  }
  return current;
}
