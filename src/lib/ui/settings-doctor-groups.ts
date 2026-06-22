import type { DoctorCheckGroup } from "@/lib/settings/doctor";

export const DOCTOR_GROUP_LABELS: Record<DoctorCheckGroup, string> = {
  workspace: "Workspace",
  rag: "RAG Index",
  provider: "Claude Provider",
  cli: "Claude CLI",
  login: "Login Helper",
  "claude-project": "Claude Project",
};
