import assert from "node:assert/strict";
import { POST as chatPost } from "../chat/route";
import { GET as chatStatusGet } from "../chat/status/route";
import { GET as exportGet } from "../export/route";
import { GET as exportZipGet } from "../export/zip/route";
import { GET as indexGet, POST as indexPost } from "../index/route";
import { GET as releaseReadinessGet } from "../release/readiness/route";
import {
  DELETE as skillDelete,
  GET as skillGet,
  PUT as skillPut,
} from "../skills/[skillName]/route";
import { POST as skillRestorePost } from "../skills/[skillName]/restore/route";
import { POST as guidedDraftPost } from "../skills/guided/draft/route";
import { POST as guidedFeedbackPost } from "../skills/guided/feedback/route";
import { POST as importApplyPost } from "../skills/import/apply/route";
import { POST as importPreviewPost } from "../skills/import/preview/route";
import { GET as skillsGet, POST as skillsPost } from "../skills/route";
import { GET as templatesGet } from "../skills/templates/route";
import { GET as validationGet } from "../skills/validation/route";
import { GET as browseGet } from "./browse/route";
import { GET as browseSearchGet } from "./browse/search/route";
import { GET as claudeCliGet, POST as claudeCliPost } from "./claude-cli/route";
import { GET as claudeProfilesGet } from "./claude-cli/profiles/route";
import { POST as claudeTestPost } from "./claude-cli/test/route";
import { GET as claudeProjectGet } from "./claude-project/route";
import { GET as doctorGet } from "./doctor/route";
import { GET as nativeFolderGet } from "./native-folder/route";
import { GET as pathExistsGet } from "./path-exists/route";
import { GET as settingsGet, POST as settingsPost } from "./route";
import { GET as runtimeGet } from "./runtime/route";
import { jsonRequest, nonLocalRequest } from "@/lib/test-utils/request";

function routeParams(skillName: string) {
  return { params: Promise.resolve({ skillName }) };
}

async function assertForbidden(
  label: string,
  response: Response | Promise<Response>,
): Promise<void> {
  const resolved = await response;
  assert.equal(resolved.status, 403, `${label} should reject non-local host`);
}

async function main(): Promise<void> {
  await assertForbidden(
    "POST /api/chat",
    chatPost(
      nonLocalRequest("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    ),
  );

  await assertForbidden(
    "GET /api/chat/status",
    chatStatusGet(nonLocalRequest("/api/chat/status")),
  );

  await assertForbidden(
    "GET /api/export",
    exportGet(nonLocalRequest("/api/export?skill=alpha")),
  );

  await assertForbidden(
    "GET /api/export/zip",
    exportZipGet(nonLocalRequest("/api/export/zip")),
  );

  await assertForbidden(
    "GET /api/index",
    indexGet(nonLocalRequest("/api/index")),
  );

  await assertForbidden(
    "POST /api/index",
    indexPost(nonLocalRequest("/api/index", { method: "POST" })),
  );

  await assertForbidden(
    "GET /api/release/readiness",
    releaseReadinessGet(nonLocalRequest("/api/release/readiness")),
  );

  await assertForbidden(
    "GET /api/settings",
    settingsGet(nonLocalRequest("/api/settings")),
  );

  await assertForbidden(
    "POST /api/settings",
    settingsPost(
      jsonRequest("/api/settings", { vars: {} }, { host: "example.com" }),
    ),
  );

  await assertForbidden(
    "GET /api/settings/browse",
    browseGet(nonLocalRequest("/api/settings/browse")),
  );

  await assertForbidden(
    "GET /api/settings/browse/search",
    browseSearchGet(
      nonLocalRequest("/api/settings/browse/search?name=.claude"),
    ),
  );

  await assertForbidden(
    "GET /api/settings/claude-cli",
    claudeCliGet(nonLocalRequest("/api/settings/claude-cli")),
  );

  await assertForbidden(
    "POST /api/settings/claude-cli",
    claudeCliPost(
      jsonRequest("/api/settings/claude-cli", {}, { host: "example.com" }),
    ),
  );

  await assertForbidden(
    "GET /api/settings/claude-cli/profiles",
    claudeProfilesGet(nonLocalRequest("/api/settings/claude-cli/profiles")),
  );

  await assertForbidden(
    "POST /api/settings/claude-cli/test",
    claudeTestPost(
      jsonRequest("/api/settings/claude-cli/test", {}, { host: "example.com" }),
    ),
  );

  await assertForbidden(
    "GET /api/settings/claude-project",
    claudeProjectGet(nonLocalRequest("/api/settings/claude-project")),
  );

  await assertForbidden(
    "GET /api/settings/doctor",
    doctorGet(nonLocalRequest("/api/settings/doctor")),
  );

  await assertForbidden(
    "GET /api/settings/native-folder",
    nativeFolderGet(
      nonLocalRequest("/api/settings/native-folder?path=~%5C.claude"),
    ),
  );

  await assertForbidden(
    "GET /api/settings/path-exists",
    pathExistsGet(
      nonLocalRequest("/api/settings/path-exists?path=~%5C.claude"),
    ),
  );

  await assertForbidden(
    "GET /api/settings/runtime",
    runtimeGet(nonLocalRequest("/api/settings/runtime")),
  );

  await assertForbidden(
    "GET /api/skills",
    skillsGet(nonLocalRequest("/api/skills")),
  );

  await assertForbidden(
    "POST /api/skills",
    skillsPost(jsonRequest("/api/skills", {}, { host: "example.com" })),
  );

  await assertForbidden(
    "GET /api/skills/[skillName]",
    skillGet(
      nonLocalRequest("/api/skills/review-helper"),
      routeParams("review-helper"),
    ),
  );

  await assertForbidden(
    "PUT /api/skills/[skillName]",
    skillPut(
      jsonRequest(
        "/api/skills/review-helper",
        {},
        { method: "PUT", host: "example.com" },
      ),
      routeParams("review-helper"),
    ),
  );

  await assertForbidden(
    "DELETE /api/skills/[skillName]",
    skillDelete(
      jsonRequest(
        "/api/skills/review-helper",
        {},
        { method: "DELETE", host: "example.com" },
      ),
      routeParams("review-helper"),
    ),
  );

  await assertForbidden(
    "POST /api/skills/[skillName]/restore",
    skillRestorePost(
      nonLocalRequest("/api/skills/review-helper/restore", { method: "POST" }),
      routeParams("review-helper"),
    ),
  );

  await assertForbidden(
    "POST /api/skills/guided/draft",
    guidedDraftPost(
      jsonRequest("/api/skills/guided/draft", {}, { host: "example.com" }),
    ),
  );

  await assertForbidden(
    "POST /api/skills/guided/feedback",
    guidedFeedbackPost(
      jsonRequest("/api/skills/guided/feedback", {}, { host: "example.com" }),
    ),
  );

  await assertForbidden(
    "POST /api/skills/import/apply",
    importApplyPost(
      jsonRequest("/api/skills/import/apply", {}, { host: "example.com" }),
    ),
  );

  await assertForbidden(
    "POST /api/skills/import/preview",
    importPreviewPost(
      jsonRequest("/api/skills/import/preview", {}, { host: "example.com" }),
    ),
  );

  await assertForbidden(
    "GET /api/skills/templates",
    templatesGet(nonLocalRequest("/api/skills/templates")),
  );

  await assertForbidden(
    "GET /api/skills/validation",
    validationGet(nonLocalRequest("/api/skills/validation")),
  );
}

main()
  .then(() => {
    console.log("Settings local guard tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
