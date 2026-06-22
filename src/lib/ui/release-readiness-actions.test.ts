import assert from "node:assert/strict";
import {
  getSettingsReleaseActionPresentation,
  getSettingsReleaseActionFocusTargets,
  isSafeInternalActionHref,
  selectReleasePrimaryAction,
  shouldShowReleaseSectionAction,
  type ReleaseActionSection,
} from "./release-readiness-actions";

const blockedSections: ReleaseActionSection[] = [
  {
    id: "workspace",
    status: "blocked",
    actionLabel: "Open Settings",
    actionHref: "/settings",
  },
  {
    id: "index",
    status: "needs_action",
    actionLabel: "Rebuild Index",
    actionHref: "/settings",
  },
  {
    id: "diagnostics",
    status: "needs_action",
    actionLabel: "Open Export",
    actionHref: "/export",
  },
];

function main() {
  assert.equal(
    isSafeInternalActionHref("/settings"),
    true,
    "plain internal routes should be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("/export?diagnostics=true"),
    true,
    "internal routes with query strings should be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("/settings#setup-doctor"),
    true,
    "internal routes with hash fragments should be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref(""),
    false,
    "blank hrefs should not be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref(" /settings"),
    false,
    "hrefs with leading whitespace should not be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("https://example.com"),
    false,
    "absolute external URLs should not be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("//example.com"),
    false,
    "protocol-relative URLs should not be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("/%2fexample.com"),
    false,
    "encoded protocol-relative URLs should not be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("/%5cexample.com"),
    false,
    "encoded backslash-prefixed URLs should not be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("/\\example.com"),
    false,
    "backslash-normalized external URLs should not be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("/settings bad"),
    false,
    "hrefs with raw whitespace should not be valid release actions",
  );
  assert.equal(
    isSafeInternalActionHref("javascript:alert(1)"),
    false,
    "script URLs should not be valid release actions",
  );

  const primary = selectReleasePrimaryAction(blockedSections);

  assert.equal(primary?.id, "workspace");
  assert.equal(
    shouldShowReleaseSectionAction({
      section: blockedSections[0],
      primaryAction: primary,
      topActionVisible: true,
    }),
    false,
    "the row matching the visible top action should not repeat the same button",
  );
  assert.equal(
    shouldShowReleaseSectionAction({
      section: blockedSections[1],
      primaryAction: primary,
      topActionVisible: true,
    }),
    true,
    "secondary unresolved sections should keep their own direct actions",
  );

  const diagnosticsOnly: ReleaseActionSection[] = [
    { id: "workspace", status: "ready" },
    {
      id: "diagnostics",
      status: "needs_action",
      actionLabel: "Open Export",
      actionHref: "/export",
    },
  ];
  const diagnosticsPrimary = selectReleasePrimaryAction(diagnosticsOnly);
  assert.equal(diagnosticsPrimary?.id, "diagnostics");
  assert.equal(
    shouldShowReleaseSectionAction({
      section: diagnosticsOnly[1],
      primaryAction: diagnosticsPrimary,
      topActionVisible: false,
    }),
    true,
    "when no top action strip is visible, diagnostics keeps its row action",
  );

  assert.equal(
    shouldShowReleaseSectionAction({
      section: { id: "chat", status: "ready" },
      primaryAction: primary,
      topActionVisible: true,
    }),
    false,
    "sections without action metadata should not render action controls",
  );

  const unsafeSections: ReleaseActionSection[] = [
    {
      id: "provider",
      status: "blocked",
      actionLabel: "Open Provider",
      actionHref: "https://example.com/settings",
    },
    {
      id: "chat",
      status: "blocked",
      actionLabel: "Open Chat",
      actionHref: "/chat",
    },
  ];
  assert.equal(
    selectReleasePrimaryAction(unsafeSections)?.id,
    "chat",
    "primary action selection should ignore unsafe external hrefs",
  );
  assert.equal(
    shouldShowReleaseSectionAction({
      section: unsafeSections[0],
      primaryAction: undefined,
      topActionVisible: false,
    }),
    false,
    "unsafe release action hrefs should not render row actions",
  );

  assert.equal(
    shouldShowReleaseSectionAction({
      section: {
        id: "chat",
        status: "blocked",
        actionLabel: "Open Settings",
        actionHref: "/settings",
      },
      primaryAction: undefined,
      topActionVisible: false,
      currentPath: "/settings",
    }),
    false,
    "Settings should not show row actions that only link back to Settings",
  );

  assert.equal(
    shouldShowReleaseSectionAction({
      section: {
        id: "index",
        status: "needs_action",
        actionLabel: "Rebuild Index",
        actionHref: "/settings",
      },
      primaryAction: undefined,
      topActionVisible: false,
      currentPath: "/settings",
    }),
    true,
    "Settings should keep local actions such as Rebuild Index even when their href is Settings",
  );

  assert.deepEqual(
    getSettingsReleaseActionPresentation({
      section: {
        id: "workspace",
        status: "blocked",
        actionLabel: "Open Settings",
        actionHref: "/settings",
      },
      saving: false,
      indexRebuilding: false,
    }),
    {
      label: "Save Paths",
      ariaLabel: "Save workspace and skills path settings",
    },
    "workspace release action should name the path-save task instead of showing generic Save",
  );

  assert.deepEqual(
    getSettingsReleaseActionPresentation({
      section: {
        id: "provider",
        status: "blocked",
        actionLabel: "Open Settings",
        actionHref: "/settings",
      },
      saving: false,
      indexRebuilding: false,
    }),
    {
      label: "Save Provider",
      ariaLabel: "Save provider settings",
    },
    "provider release action should name the provider-save task instead of showing generic Save",
  );

  assert.deepEqual(
    getSettingsReleaseActionPresentation({
      section: {
        id: "index",
        status: "needs_action",
        actionLabel: "Rebuild Index",
        actionHref: "/settings",
      },
      saving: false,
      indexRebuilding: true,
    }),
    {
      label: "Rebuilding...",
      ariaLabel: "Rebuilding RAG index",
    },
    "index release action should expose its loading state",
  );

  assert.deepEqual(
    getSettingsReleaseActionFocusTargets({
      id: "workspace",
      status: "blocked",
      actionLabel: "Open Settings",
      actionHref: "/settings",
    }),
    ["settings-workspace-root", "settings-skills-dir"],
    "workspace release actions should focus the path fields they ask the user to fix",
  );

  assert.deepEqual(
    getSettingsReleaseActionFocusTargets({
      id: "provider",
      status: "blocked",
      actionLabel: "Open Settings",
      actionHref: "/settings",
    }),
    [
      "settings-anthropic-api-key",
      "settings-llm-provider",
      "settings-enable-local-claude-cli",
    ],
    "provider release actions should focus auth/provider controls instead of leaving the user at the sidebar",
  );

  assert.deepEqual(
    getSettingsReleaseActionFocusTargets({
      id: "diagnostics",
      status: "needs_action",
      actionLabel: "Open Export",
      actionHref: "/export",
    }),
    [],
    "off-page release actions should not claim Settings focus targets",
  );

  console.log("Release readiness action helper tests passed");
}

main();
