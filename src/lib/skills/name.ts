const MANAGED_SKILL_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function isManagedSkillName(name: string): boolean {
  return MANAGED_SKILL_NAME_PATTERN.test(name);
}
