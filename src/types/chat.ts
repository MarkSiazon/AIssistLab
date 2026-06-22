export interface Citation {
  skillName: string;
  section: string;
  score: number;
  preview: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  streaming?: boolean;
  error?: boolean;
  retryQuery?: string;
}

export type StreamChunk =
  | { type: "citations"; sources: Citation[] }
  | { type: "text"; text: string }
  | { type: "error"; message: string };
