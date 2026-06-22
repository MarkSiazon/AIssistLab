export interface SkillFrontmatter {
  name?: string;
  description: string;
  tags?: string[];
  version?: string;
  author?: string;
  when_to_use?: string;
  "argument-hint"?: string;
  arguments?: Array<Record<string, unknown>>;
  "disable-model-invocation"?: boolean;
  "user-invocable"?: boolean;
  "allowed-tools"?: string[];
  "disallowed-tools"?: string[];
  model?: string;
  effort?: string;
  context?: string[];
  agent?: string;
  hooks?: string[];
  paths?: string[];
  shell?: {
    command?: string;
    timeout?: number;
  };
  [key: string]: unknown;
}

export interface Skill {
  name: string;
  filePath: string;
  frontmatter: SkillFrontmatter;
  body: string;
  raw: string;
  updatedAt: string;
}

export interface SkillSummary {
  name: string;
  description: string;
  tags: string[];
  updatedAt: string;
}

export interface SkillChunk {
  skillName: string;
  chunkIndex: number;
  text: string;
  sourceLines: string;
}

export interface SearchResult {
  chunk: SkillChunk;
  score: number;
  skill: Skill;
}
