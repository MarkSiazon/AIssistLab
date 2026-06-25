import { countLabel } from "@/lib/format/count-label";
import {
  createDoctorCheck as check,
  type SetupDoctorCheck,
  type SetupDoctorInput,
} from "@/lib/settings/doctor-model";

export function buildRagIndexChecks(
  input: SetupDoctorInput,
): SetupDoctorCheck[] {
  if (input.index.status === "ready") {
    return [
      input.index.skillCount > 0
        ? check(
            "rag-index",
            "rag",
            "RAG index",
            "ok",
            `${countLabel(input.index.skillCount, "skill")} and ${countLabel(input.index.chunkCount, "chunk")} indexed.`,
            [],
          )
        : check(
            "rag-index",
            "rag",
            "RAG index",
            "warn",
            "The RAG index is ready but has no skills.",
            ["WORKSPACE_ROOT", "SKILLS_DIR"],
            "Verify WORKSPACE_ROOT and SKILLS_DIR, then rebuild the index.",
          ),
    ];
  }

  if (input.index.status === "stale") {
    return [
      check(
        "rag-index",
        "rag",
        "RAG index",
        "warn",
        `The RAG index is stale: ${input.index.staleReason ?? "workspace or skill files changed"}`,
        ["WORKSPACE_ROOT", "SKILLS_DIR"],
        "Use Rebuild Index after workspace and skills paths are correct.",
      ),
    ];
  }

  if (input.index.status === "failed") {
    return [
      check(
        "rag-index",
        "rag",
        "RAG index",
        "error",
        `The RAG index rebuild failed: ${input.index.error ?? "unknown error"}`,
        ["WORKSPACE_ROOT", "SKILLS_DIR"],
        "Fix the workspace or skills path problem, then use Rebuild Index.",
      ),
    ];
  }

  if (input.index.status === "rebuilding") {
    return [
      check(
        "rag-index",
        "rag",
        "RAG index",
        "warn",
        "The RAG index is rebuilding.",
        [],
        "Wait for the rebuild to finish, then refresh Setup Doctor.",
      ),
    ];
  }

  return [
    check(
      "rag-index",
      "rag",
      "RAG index",
      "warn",
      "The RAG index has not been built.",
      [],
      "Use Rebuild Index after the workspace and skills paths are correct.",
    ),
  ];
}
