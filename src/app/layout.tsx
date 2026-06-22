import type { Metadata } from "next";
import "./globals.css";
import "./styles/chat.css";
import "./styles/skills.css";
import "./styles/settings.css";
import "./styles/editor.css";
import "./styles/export.css";
import "./styles/guided.css";
import "./styles/path-picker.css";
import "./styles/prose.css";
import "./styles/responsive.css";
import { RouteFocusAnnouncer } from "@/components/layout/RouteFocusAnnouncer";
import { Sidebar } from "@/components/layout/Sidebar";
import { MAIN_CONTENT_ID } from "@/lib/ui/route-announcement";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE ?? "Skill Workshop RAG",
  description: "Claude Code CLI skill orchestration and RAG interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-shell">
        <RouteFocusAnnouncer />
        <a className="skip-link" href={`#${MAIN_CONTENT_ID}`} tabIndex={0}>
          Skip to main content
        </a>
        <Sidebar />
        <main className="app-main" id={MAIN_CONTENT_ID} tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
