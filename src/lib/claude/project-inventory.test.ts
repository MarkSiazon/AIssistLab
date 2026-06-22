import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function withWorkspace(fn: (root: string) => Promise<void>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "claude-project-"));
  try {
    await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function main() {
  const inventory = await import("./project-inventory");
  const sampleEmail = ["owner", "example.invalid"].join("@");
  const sampleToken = ["sk", "ant", "secret"].join("-");
  const sampleCommand = ["secret", "command"].join("-");
  const sampleHookCommand = ["secret", "hook"].join("-");
  const sampleHeaderKey = ["Author", "ization"].join("");

  await withWorkspace(async (root) => {
    await fs.mkdir(path.join(root, ".claude", "skills", "review"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(root, ".claude", "skills", "review", "SKILL.md"),
      "---\ndescription: Review helper\n---\n\nUse for reviews.\n",
    );
    await fs.writeFile(
      path.join(root, ".claude", "skills", "legacy.md"),
      "---\ndescription: Legacy skill\n---\n\nLegacy content.\n",
    );
    await fs.mkdir(path.join(root, ".claude", "commands"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".claude", "commands", "ship.md"),
      "Ship checklist.",
    );
    await fs.mkdir(path.join(root, ".claude", "agents", "qa"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(root, ".claude", "agents", "qa", "tester.md"),
      "---\nname: qa-tester\ndescription: Runs QA\n---\n\nDo QA.",
    );
    await fs.writeFile(
      path.join(root, ".claude", "agents", "qa", "broken.md"),
      "---\nname: missing-description\n---\n\nMissing description.",
    );
    await fs.writeFile(
      path.join(root, ".claude", "agents", "qa", "malformed.md"),
      "---\nname: [broken\n---\n\nMalformed frontmatter.",
    );
    await fs.writeFile(
      path.join(root, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          privateServer: {
            command: "node",
            args: [`--token=${sampleToken}`, `--owner=${sampleEmail}`],
            headers: { [sampleHeaderKey]: `Bearer ${sampleToken}` },
          },
          otherServer: { command: sampleCommand },
        },
      }),
    );
    await fs.writeFile(
      path.join(root, ".claude", "settings.json"),
      JSON.stringify({
        hooks: {
          PreToolUse: [{ matcher: "*", hooks: [{ command: sampleHookCommand }] }],
          Stop: [{ hooks: [{ command: sampleHookCommand }] }],
        },
      }),
    );
    await fs.writeFile(
      path.join(root, ".claude", "settings.local.json"),
      JSON.stringify({ localOnly: true }),
    );
    await fs.mkdir(path.join(root, ".claude-plugin"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".claude-plugin", "plugin.json"),
      JSON.stringify({ name: "sample-plugin" }),
    );

    const result = await inventory.getClaudeProjectInventory(root);
    assert.deepEqual(result.counts, {
      skills: 2,
      commands: 1,
      agents: 3,
      mcpServers: 2,
      hooks: 2,
      pluginFolders: 1,
    });
    assert.equal(
      result.checks.some(
        (item) => item.id === "claude-agents" && item.status === "warn",
      ),
      true,
    );
    assert.equal(
      result.checks.some(
        (item) => item.id === "claude-project-settings" && item.status === "ok",
      ),
      true,
    );
    assert.equal(result.reloadHints.includes("Restart Claude Code after editing project settings or MCP servers."), true);
    assert.equal(result.reloadHints.includes("Reload skills after adding or changing skill packages."), true);

    const raw = JSON.stringify(result);
    assert.doesNotMatch(raw, new RegExp(root.replace(/\\/g, "\\\\"), "i"));
    assert.doesNotMatch(raw, /[A-Z]:[\\/]/i);
    assert.doesNotMatch(raw, new RegExp(sampleEmail.replace(".", "\\."), "i"));
    assert.doesNotMatch(raw, new RegExp(["sk", "ant"].join("-"), "i"));
    assert.equal(raw.includes(sampleCommand), false);
    assert.equal(raw.includes(sampleHookCommand), false);
    assert.equal(raw.includes(sampleHeaderKey), false);
  });

  await withWorkspace(async (root) => {
    await fs.writeFile(path.join(root, ".mcp.json"), "{ invalid");
    const result = await inventory.getClaudeProjectInventory(root);
    const mcpCheck = result.checks.find((item) => item.id === "claude-mcp");
    assert.equal(mcpCheck?.status, "warn");
    assert.equal(result.counts.mcpServers, 0);
  });

  const missing = await inventory.getClaudeProjectInventory(
    path.join(os.tmpdir(), "missing-claude-project-workspace"),
  );
  assert.equal(missing.counts.skills, 0);
  assert.equal(
    missing.checks.some(
      (item) => item.id === "claude-project-workspace" && item.status === "error",
    ),
    true,
  );

  console.log("Claude project inventory tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
