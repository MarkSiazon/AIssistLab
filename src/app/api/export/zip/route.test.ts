import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";
import { withTempWorkspace } from "@/lib/test-utils/workspace";
import { extractZipEntries } from "@/lib/test-utils/zip";

async function main() {
  const route = await import("./route");

  await withTempWorkspace(
    {
      prefix: "export-zip-",
      skills: [
        {
          name: "alpha",
          content: "---\ndescription: Alpha\n---\n\n## Instructions\n\nAlpha content.\n",
        },
        {
          name: "beta",
          content: "---\ndescription: Beta\n---\n\n## Instructions\n\nBeta content.\n",
        },
        {
          name: "alpha,beta",
          content: "---\ndescription: Comma\n---\n\n## Instructions\n\nComma content.\n",
        },
      ],
    },
    async ({ root }) => {
      await fs.mkdir(path.join(root, ".claude", "commands"), { recursive: true });
      await fs.writeFile(
        path.join(root, ".claude", "commands", "review.md"),
        "Review command.",
      );

      const blocked = await route.GET(nonLocalRequest("/api/export/zip"));
      assert.equal(blocked.status, 403);

      const response = await route.GET(
        localRequest("/api/export/zip?skills=alpha&diagnostics=true"),
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "application/zip");
      assert.match(
        response.headers.get("content-disposition") ?? "",
        /claude-skills.zip/,
      );

      const zip = Buffer.from(await response.arrayBuffer());
      const entries = extractZipEntries(zip);
      assert.equal(typeof entries["diagnostics/claude-project.json"], "string");
      const projectDiagnostics = JSON.parse(
        entries["diagnostics/claude-project.json"],
      );
      assert.equal(projectDiagnostics.counts.commands, 1);
      assert.equal(
        JSON.stringify(projectDiagnostics).includes("review.md"),
        false,
      );
      assert.equal(typeof entries["diagnostics/manifest.json"], "string");
      assert.equal(typeof entries["diagnostics/readiness.json"], "string");
      const manifest = JSON.parse(entries["diagnostics/manifest.json"]);
      assert.equal(manifest.schemaVersion, 1);
      assert.equal(manifest.diagnostics.includes("readiness"), true);
      assert.equal(typeof manifest.generatedAt, "string");
      const readiness = JSON.parse(entries["diagnostics/readiness.json"]);
      assert.equal(readiness.schemaVersion, 1);
      assert.equal(typeof readiness.summary.status, "string");
      assert.equal(typeof readiness.summary.score, "number");
      assert.equal(typeof readiness.summary.canChat, "boolean");
      assert.equal(typeof readiness.summary.canExportDiagnostics, "boolean");
      assert.equal(Array.isArray(readiness.sections), true);
      assert.equal(
        readiness.sections.some(
          (section: { id: string }) => section.id === "claude_project",
        ),
        true,
      );
      assert.equal(readiness.exportedSkillCount, 1);
      assert.equal(
        JSON.stringify(readiness).includes(
          path.basename(process.env.WORKSPACE_ROOT ?? ""),
        ),
        false,
      );
      const diagnosticsRaw = Object.entries(entries)
        .filter(([name]) => name.startsWith("diagnostics/"))
        .map(([, content]) => content)
        .join("\n");
      assert.doesNotMatch(diagnosticsRaw, /[A-Z]:[\\/]/i);
      assert.doesNotMatch(diagnosticsRaw, /[\\/](?:Users|home)[\\/]/i);
      assert.doesNotMatch(diagnosticsRaw, /oauth/i);
      assert.doesNotMatch(diagnosticsRaw, /Authorization/i);
      assert.doesNotMatch(diagnosticsRaw, /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i);
      assert.doesNotMatch(diagnosticsRaw, /sk-[A-Za-z0-9_-]{10,}/i);
      assert.doesNotMatch(diagnosticsRaw, /\.claude-profiles[\\/][^"'\s]+/i);

      const exactNameResponse = await route.GET(
        localRequest("/api/export/zip?skill=alpha%2Cbeta"),
      );
      const exactNameEntries = extractZipEntries(
        Buffer.from(await exactNameResponse.arrayBuffer()),
      );
      assert.deepEqual(Object.keys(exactNameEntries).sort(), [
        "alpha,beta.md",
      ]);
    },
  );

  console.log("Export ZIP route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
