import { TfIdf } from "natural";
import { Skill, SkillChunk } from "@/types/skill";

export interface SkillIndex {
  tfidf: TfIdf;
  chunks: SkillChunk[];
  skillMap: Map<string, Skill>;
  builtAt: Date;
}

export function chunkSkill(skill: Skill): SkillChunk[] {
  const lines = skill.body.split("\n");
  const chunks: SkillChunk[] = [];
  let current: string[] = [];
  let startLine = 0;

  const flush = (endLine: number) => {
    const text = current.join("\n").trim();
    if (text.length > 30) {
      chunks.push({
        skillName: skill.name,
        chunkIndex: chunks.length,
        text: `Skill: ${skill.name}\nDescription: ${skill.frontmatter.description}\n\n${text}`,
        sourceLines: `lines ${startLine + 1}–${endLine}`,
      });
    }
    current = [];
  };

  lines.forEach((line, i) => {
    if (/^#{1,3}\s/.test(line) && current.length > 0) {
      flush(i);
      startLine = i;
    }
    current.push(line);
  });
  flush(lines.length);

  // Always include a full-skill chunk for broad matching
  chunks.push({
    skillName: skill.name,
    chunkIndex: chunks.length,
    text: `Skill: ${skill.name}\nDescription: ${skill.frontmatter.description}\n\n${skill.body}`,
    sourceLines: "full document",
  });

  return chunks;
}

export function buildIndex(skills: Skill[]): SkillIndex {
  const tfidf = new TfIdf();
  const chunks: SkillChunk[] = [];
  const skillMap = new Map<string, Skill>();

  for (const skill of skills) {
    skillMap.set(skill.name, skill);
    const skillChunks = chunkSkill(skill);
    for (const chunk of skillChunks) {
      chunks.push(chunk);
      tfidf.addDocument(chunk.text);
    }
  }

  return { tfidf, chunks, skillMap, builtAt: new Date() };
}
