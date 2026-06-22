export interface SkillEditorSnapshotValues {
  name: string;
  description: string;
  tagsInput: string;
  body: string;
}

export function skillEditorSnapshot(values: SkillEditorSnapshotValues): string {
  return JSON.stringify(values);
}
