import { SkillIndex } from "./indexer";
import { SearchResult } from "@/types/skill";

export function retrieve(
  query: string,
  index: SkillIndex,
  topK = 5,
): SearchResult[] {
  const scores: Array<{ idx: number; score: number }> = [];

  index.tfidf.tfidfs(query, (i, measure) => {
    scores.push({ idx: i, score: measure });
  });

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((s) => s.score > 0)
    .map((s) => ({
      chunk: index.chunks[s.idx],
      score: s.score,
      skill: index.skillMap.get(index.chunks[s.idx].skillName)!,
    }))
    .filter((r) => r.skill != null);
}
