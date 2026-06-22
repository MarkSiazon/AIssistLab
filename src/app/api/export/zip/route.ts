import archiver from "archiver";
import { readAllSkills } from "@/lib/skills/reader";
import { Readable } from "stream";
import { withLocalDeviceGuard } from "@/lib/local-access";
import { readEnvFile } from "@/lib/settings/env";
import { getActiveRuntimeProviderStatus } from "@/lib/settings/runtime-config";
import { getCurrentReleaseReadinessEvidence } from "@/lib/release/readiness-report";

export const runtime = "nodejs";

function diagnosticJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function selectedSkillNames(searchParams: URLSearchParams): Set<string> {
  const explicitNames = searchParams
    .getAll("skill")
    .map((name) => name.trim())
    .filter(Boolean);

  if (explicitNames.length > 0) {
    return new Set(explicitNames);
  }

  return new Set(
    searchParams
      .getAll("skills")
      .flatMap((value) => value.split(","))
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

export const GET = withLocalDeviceGuard(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const selectedNames = selectedSkillNames(searchParams);
  const includeDiagnostics = searchParams.get("diagnostics") === "true";
  const allSkills = await readAllSkills();
  const skills =
    selectedNames.size > 0
      ? allSkills.filter((skill) => selectedNames.has(skill.name))
      : allSkills;

  const archive = archiver("zip", { zlib: { level: 9 } });

  for (const skill of skills) {
    archive.append(skill.raw, { name: `${skill.name}.md` });
  }

  if (includeDiagnostics) {
    const env = await readEnvFile();
    const workspaceRoot =
      process.env.WORKSPACE_ROOT ?? env.parsed.WORKSPACE_ROOT ?? process.cwd();
    const generatedAt = new Date().toISOString();
    const evidence = await getCurrentReleaseReadinessEvidence({
      generatedAt,
      skills,
      workspaceRoot,
    });
    const provider = getActiveRuntimeProviderStatus();
    const settingsSummary = {
      appTitle: env.parsed.NEXT_PUBLIC_APP_TITLE ?? "",
      provider,
      workspaceRootConfigured: Boolean(env.parsed.WORKSPACE_ROOT?.trim()),
      skillsDirConfigured: Boolean(env.parsed.SKILLS_DIR?.trim()),
      exportedSkillCount: skills.length,
    };
    const diagnostics = [
      "manifest",
      "readiness",
      "index",
      "skill-quality",
      "claude-project",
      "settings-summary",
    ];

    archive.append(
      diagnosticJson({
        schemaVersion: 1,
        generatedAt,
        diagnostics,
        exportedSkillCount: skills.length,
      }),
      { name: "diagnostics/manifest.json" },
    );
    archive.append(
      diagnosticJson({
        ...evidence.readiness,
        exportedSkillCount: skills.length,
      }),
      { name: "diagnostics/readiness.json" },
    );
    archive.append(diagnosticJson(evidence.index), {
      name: "diagnostics/index.json",
    });
    archive.append(diagnosticJson(evidence.skillQuality), {
      name: "diagnostics/skill-quality.json",
    });
    archive.append(diagnosticJson(evidence.claudeProject), {
      name: "diagnostics/claude-project.json",
    });
    archive.append(diagnosticJson(settingsSummary), {
      name: "diagnostics/settings-summary.json",
    });
  }

  archive.finalize();

  const webStream = Readable.toWeb(archive) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="claude-skills.zip"',
    },
  });
});
