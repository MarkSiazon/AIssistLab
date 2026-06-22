import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  jsonRequest,
  localRequest,
  nonLocalRequest,
  testRequest,
} from "@/lib/test-utils/request";
import { withTempWorkspace, type TempWorkspace } from "@/lib/test-utils/workspace";

async function withWorkspace(fn: (workspace: TempWorkspace) => Promise<void>) {
  await withTempWorkspace(
    {
      prefix: "skill-life-api-",
      env: {
        SKILL_IMPORT_PREVIEW_CACHE_PATH: ({ root }) =>
          path.join(root, "previews.json"),
        SKILL_TRASH_DIR: ({ root }) => path.join(root, "trash"),
      },
    },
    fn,
  );
}

async function main() {
  const templatesRoute = await import("./templates/route");
  const previewRoute = await import("./import/preview/route");
  const applyRoute = await import("./import/apply/route");
  const skillsRoute = await import("./route");
  const skillRoute = await import("./[skillName]/route");
  const restoreRoute = await import("./[skillName]/restore/route");

  await withWorkspace(async ({ root }) => {
    const blockedTemplates = await templatesRoute.GET(
      nonLocalRequest("/api/skills/templates"),
    );
    assert.equal(blockedTemplates.status, 403);

    const blockedPreview = await previewRoute.POST(
      jsonRequest(
        "/api/skills/import/preview",
        { sourceType: "folder", path: root },
        { host: "example.com" },
      ),
    );
    assert.equal(blockedPreview.status, 403);

    const blockedApply = await applyRoute.POST(
      jsonRequest("/api/skills/import/apply", {}, { host: "example.com" }),
    );
    assert.equal(blockedApply.status, 403);

    const malformedPreview = await previewRoute.POST(
      testRequest("/api/skills/import/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );
    const malformedPreviewPayload = await malformedPreview.json();
    assert.equal(malformedPreview.status, 400);
    assert.equal(malformedPreviewPayload.ok, false);
    assert.match(malformedPreviewPayload.error, /Import source is required/);

    const malformedApply = await applyRoute.POST(
      testRequest("/api/skills/import/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );
    const malformedApplyPayload = await malformedApply.json();
    assert.equal(malformedApply.status, 400);
    assert.equal(malformedApplyPayload.ok, false);
    assert.match(malformedApplyPayload.error, /Import confirmation is required/);

    const blockedRestore = await restoreRoute.POST(
      nonLocalRequest("/api/skills/imported/restore", { method: "POST" }),
      { params: Promise.resolve({ skillName: "imported" }) },
    );
    assert.equal(blockedRestore.status, 403);

    const templates = await templatesRoute.GET(
      localRequest("/api/skills/templates"),
    );
    const templatesPayload = await templates.json();
    assert.equal(templates.status, 200);
    assert.equal(templatesPayload.templates.length, 5);

    const incoming = path.join(root, "incoming");
    await fs.mkdir(incoming, { recursive: true });
    await fs.writeFile(
      path.join(incoming, "imported.md"),
      [
        "---",
        "description: Imported workflow skill",
        "tags: [workflow]",
        "---",
        "",
        "## Instructions",
        "",
        "Use when importing a folder.",
      ].join("\n"),
      "utf-8",
    );

    const preview = await previewRoute.POST(
      jsonRequest("/api/skills/import/preview", {
        sourceType: "folder",
        path: incoming,
      }),
    );
    const previewPayload = await preview.json();
    assert.equal(preview.status, 200);
    assert.equal(previewPayload.skills[0].name, "imported");
    assert.equal(JSON.stringify(previewPayload).includes(root), false);

    const missingPreview = await previewRoute.POST(
      jsonRequest("/api/skills/import/preview", {
        sourceType: "folder",
        path: path.join(root, "missing-folder"),
      }),
    );
    const missingPreviewPayload = await missingPreview.json();
    assert.equal(missingPreview.status, 400);
    assert.equal(JSON.stringify(missingPreviewPayload).includes(root), false);

    const apply = await applyRoute.POST(
      jsonRequest("/api/skills/import/apply", {
        previewId: previewPayload.previewId,
        confirm: true,
        duplicateStrategy: "skip",
      }),
    );
    const applyPayload = await apply.json();
    assert.equal(apply.status, 200);
    assert.deepEqual(applyPayload.written, ["imported"]);
    assert.equal(applyPayload.indexState.status, "stale");

    const deniedDelete = await skillRoute.DELETE(
      jsonRequest(
        "/api/skills/imported",
        { confirmName: "wrong" },
        { method: "DELETE" },
      ),
      { params: Promise.resolve({ skillName: "imported" }) },
    );
    assert.equal(deniedDelete.status, 400);

    const deleted = await skillRoute.DELETE(
      jsonRequest(
        "/api/skills/imported",
        { confirmName: "imported" },
        { method: "DELETE" },
      ),
      { params: Promise.resolve({ skillName: "imported" }) },
    );
    const deletedPayload = await deleted.json();
    assert.equal(deleted.status, 200);
    assert.equal(deletedPayload.trash.skillName, "imported");
    assert.equal(deletedPayload.indexState.status, "stale");

    const listAfterDelete = await skillsRoute.GET(localRequest("/api/skills"));
    const listPayload = await listAfterDelete.json();
    assert.equal(listPayload.latestDeleted.skillName, "imported");

    const restored = await restoreRoute.POST(
      localRequest("/api/skills/imported/restore", { method: "POST" }),
      { params: Promise.resolve({ skillName: "imported" }) },
    );
    const restoredPayload = await restored.json();
    assert.equal(restored.status, 200);
    assert.equal(restoredPayload.restored.skillName, "imported");
    assert.equal(restoredPayload.indexState.status, "stale");
  });

  await withWorkspace(async ({ root }) => {
    await fs.writeFile(
      path.join(root, ".claude", "skills", "conflict.md"),
      [
        "---",
        "description: Deleted skill",
        "---",
        "",
        "## Instructions",
        "",
        "Original content.",
      ].join("\n"),
      "utf-8",
    );

    const deleted = await skillRoute.DELETE(
      jsonRequest(
        "/api/skills/conflict",
        { confirmName: "conflict" },
        { method: "DELETE" },
      ),
      { params: Promise.resolve({ skillName: "conflict" }) },
    );
    assert.equal(deleted.status, 200);

    await fs.writeFile(
      path.join(root, ".claude", "skills", "conflict.md"),
      [
        "---",
        "description: Recreated skill",
        "---",
        "",
        "## Instructions",
        "",
        "Do not overwrite this file during restore.",
      ].join("\n"),
      "utf-8",
    );

    const conflict = await restoreRoute.POST(
      localRequest("/api/skills/conflict/restore", { method: "POST" }),
      { params: Promise.resolve({ skillName: "conflict" }) },
    );
    const conflictPayload = await conflict.json();
    assert.equal(conflict.status, 400);
    assert.match(conflictPayload.error, /already exists/i);
    assert.equal(JSON.stringify(conflictPayload).includes(root), false);
  });

  console.log("Skill lifecycle route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
