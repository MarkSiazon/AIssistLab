"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function SkillMarkdownPreview({ body }: { body: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  );
}
