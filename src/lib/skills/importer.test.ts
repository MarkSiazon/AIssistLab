import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { withTempWorkspace } from "@/lib/test-utils/workspace";
import {
  createZip,
  spoofLocalUncompressedSize,
} from "@/lib/test-utils/zip";

async function withWorkspace(fn: (root: string) => Promise<void>) {
  await withTempWorkspace(
    {
      prefix: "skill-importer-",
      env: {
        SKILL_IMPORT_PREVIEW_CACHE_PATH: ({ root }) =>
          path.join(root, "preview-cache.json"),
      },
      clearIndexState: false,
      clearRuntimeProviderSettings: false,
    },
    ({ root }) => fn(root),
  );
}

async function main() {
  const importer = await import("./importer");
  const originalFetch = globalThis.fetch;

  await withWorkspace(async () => {
    await assert.rejects(
      () =>
        importer.createSkillImportPreview({
          sourceType: "folder",
          path: "",
        }),
      /folder path is required/i,
    );
    await assert.rejects(
      () =>
        importer.createSkillImportPreview({
          sourceType: "archive",
          archiveBase64: "",
          fileName: "empty.zip",
        }),
      /archive file is required/i,
    );
    await assert.rejects(
      () =>
        importer.createSkillImportPreview({
          sourceType: "github",
          url: "",
        }),
      /github url is required/i,
    );
  });

  await withWorkspace(async (root) => {
    const importRoot = path.join(root, "incoming");
    await fs.mkdir(importRoot, { recursive: true });
    await fs.writeFile(
      path.join(importRoot, "review-helper.md"),
      [
        "---",
        "description: Review code changes before merging",
        "tags: [review]",
        "---",
        "",
        "## Instructions",
        "",
        "Review the diff and list concrete risks.",
      ].join("\n"),
    );

    const preview = await importer.createSkillImportPreview({
      sourceType: "folder",
      path: importRoot,
    });

    assert.equal(preview.ok, true);
    assert.equal(preview.sourceType, "folder");
    assert.equal(preview.skills.length, 1);
    assert.equal(preview.skills[0].name, "review-helper");
    assert.equal(preview.skills[0].duplicate, false);
    assert.equal(JSON.stringify(preview).includes(root), false);

    const beforeApply = await fs.readdir(path.join(root, ".claude", "skills"));
    assert.deepEqual(beforeApply, []);

    await assert.rejects(
      () =>
        importer.applySkillImportPreview({
          previewId: preview.previewId,
          confirm: true,
          duplicateStrategy: "replace" as never,
        }),
      /duplicate strategy/i,
    );

    await importer.applySkillImportPreview({
      previewId: preview.previewId,
      confirm: true,
      duplicateStrategy: "skip",
    });

    const written = await fs.readFile(
      path.join(root, ".claude", "skills", "review-helper.md"),
      "utf-8",
    );
    assert.equal(written.includes("Review code changes"), true);
  });

  await withWorkspace(async (root) => {
    const reader = await import("./reader");
    const importRoot = path.join(root, "mixed-tags-incoming");
    await fs.mkdir(importRoot, { recursive: true });
    await fs.writeFile(
      path.join(importRoot, "mixed-tags.md"),
      [
        "---",
        "description: Imported skill with mixed tags",
        "tags: [review, 123, false, '', ' smoke ']",
        "---",
        "",
        "## Instructions",
        "",
        "Only string tags should survive import.",
      ].join("\n"),
    );

    const preview = await importer.createSkillImportPreview({
      sourceType: "folder",
      path: importRoot,
    });
    assert.equal(preview.ok, true);

    await importer.applySkillImportPreview({
      previewId: preview.previewId,
      confirm: true,
      duplicateStrategy: "skip",
    });

    const imported = await reader.readSkill("mixed-tags");
    assert.deepEqual(imported?.frontmatter.tags, ["review", "smoke"]);
  });

  await withWorkspace(async (root) => {
    const importRoot = path.join(root, "invalid-incoming");
    await fs.mkdir(importRoot, { recursive: true });
    await fs.writeFile(
      path.join(importRoot, "invalid.md"),
      ["---", "tags: [broken]", "---", ""].join("\n"),
    );

    const preview = await importer.createSkillImportPreview({
      sourceType: "folder",
      path: importRoot,
    });

    assert.equal(preview.ok, false);
    await assert.rejects(
      () =>
        importer.applySkillImportPreview({
          previewId: preview.previewId,
          confirm: true,
          duplicateStrategy: "skip",
        }),
      /validation errors/i,
    );
    const afterApply = await fs.readdir(path.join(root, ".claude", "skills"));
    assert.deepEqual(afterApply, []);
  });

  await withWorkspace(async (root) => {
    const importRoot = path.join(root, "malformed-incoming");
    await fs.mkdir(importRoot, { recursive: true });
    await fs.writeFile(
      path.join(importRoot, "malformed-frontmatter.md"),
      [
        "---",
        "description: [broken",
        "---",
        "",
        "## Instructions",
        "",
        "This import preview should report the broken metadata block.",
      ].join("\n"),
    );

    const preview = await importer.createSkillImportPreview({
      sourceType: "folder",
      path: importRoot,
    });

    assert.equal(preview.ok, false);
    assert.equal(
      preview.skills[0].validationErrors.some(
        (item) => item.code === "invalid_frontmatter_syntax",
      ),
      true,
    );
  });

  await withWorkspace(async (root) => {
    const importRoot = path.join(root, "non-object-incoming");
    await fs.mkdir(importRoot, { recursive: true });
    await fs.writeFile(
      path.join(importRoot, "non-object-frontmatter.md"),
      [
        "---",
        "- not",
        "- metadata",
        "---",
        "",
        "## Instructions",
        "",
        "This import preview should report the non-object metadata block.",
      ].join("\n"),
    );

    const preview = await importer.createSkillImportPreview({
      sourceType: "folder",
      path: importRoot,
    });

    assert.equal(preview.ok, false);
    assert.equal(
      preview.skills[0].validationErrors.some(
        (item) =>
          item.code === "invalid_frontmatter_syntax" &&
          item.message.includes("must be an object"),
      ),
      true,
    );
  });

  await withWorkspace(async (root) => {
    const zip = createZip({
      "../escape.md": "## Bad\n",
    });
    await assert.rejects(
      () =>
        importer.createSkillImportPreview({
          sourceType: "archive",
          archiveBase64: zip.toString("base64"),
          fileName: "bad.zip",
        }),
      /path traversal/i,
    );

    const goodZip = createZip({
      "skills/alpha.md": [
        "---",
        "description: Alpha imported skill",
        "---",
        "",
        "## Instructions",
        "",
        "Use this alpha skill for testing.",
      ].join("\n"),
    });
    const preview = await importer.createSkillImportPreview({
      sourceType: "archive",
      archiveBase64: goodZip.toString("base64"),
      fileName: "skills.zip",
    });
    assert.equal(preview.sourceType, "archive");
    assert.equal(preview.skills[0].name, "alpha");
    assert.equal(JSON.stringify(preview).includes(root), false);

    const inflatedTooLarge = spoofLocalUncompressedSize(
      createZip({
        "skills/too-large.md": [
          "---",
          "description: Oversized archive skill",
          "---",
          "",
          "A".repeat(500_001),
        ].join("\n"),
      }),
      100,
    );
    await assert.rejects(
      () =>
        importer.createSkillImportPreview({
          sourceType: "archive",
          archiveBase64: inflatedTooLarge.toString("base64"),
          fileName: "inflated.zip",
        }),
      /too large/i,
    );
  });

  await withWorkspace(async () => {
    try {
      globalThis.fetch = (async () =>
        new Response("oversized", {
          status: 200,
          headers: { "content-length": "500001" },
        })) as typeof fetch;

      await assert.rejects(
        () =>
          importer.createSkillImportPreview({
            sourceType: "github",
            url: "https://raw.githubusercontent.com/example/repo/main/big.md",
          }),
        /too large/i,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  console.log("Skill importer tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
