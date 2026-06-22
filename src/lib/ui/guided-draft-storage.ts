export const GUIDED_DRAFT_STORAGE_KEY = "skill-workshop-guided-draft";

export interface GuidedDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readGuidedDraftFromStorage(
  storage: GuidedDraftStorage,
): unknown | null {
  try {
    const rawDraft = storage.getItem(GUIDED_DRAFT_STORAGE_KEY);
    return rawDraft ? JSON.parse(rawDraft) : null;
  } catch {
    return null;
  }
}

export function writeGuidedDraftToStorage(
  storage: GuidedDraftStorage,
  draft: unknown,
): boolean {
  try {
    storage.setItem(GUIDED_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearGuidedDraftFromStorage(storage: GuidedDraftStorage): void {
  try {
    storage.removeItem(GUIDED_DRAFT_STORAGE_KEY);
  } catch {
    // Some embedded browser contexts restrict storage access.
  }
}
