import assert from "node:assert/strict";
import {
  buildChatEmptyActions,
  buildChatEmptySuggestions,
  buildChatReadinessActionVisibility,
  type ChatEmptyStateStatus,
} from "./chat-empty-state";
import { isSafeInternalActionHref } from "./internal-action-href";

const baseStatus: ChatEmptyStateStatus = {
  canSend: true,
  hasStatusError: false,
  indexStatus: "ready",
  indexSkillCount: 2,
  suggestedQuestions: [],
};

function ids(actions: ReturnType<typeof buildChatEmptyActions>) {
  return actions.map((action) => action.id);
}

function actionById(
  actions: ReturnType<typeof buildChatEmptyActions>,
  id: string,
) {
  return actions.find((action) => action.id === id);
}

function assertActionRoutes(actions: ReturnType<typeof buildChatEmptyActions>) {
  for (const action of actions) {
    if (action.id === "rebuild-index") {
      assert.equal("href" in action, false, "rebuild action should render as a button");
    } else {
      assert.equal(
        isSafeInternalActionHref(action.href),
        true,
        `${action.id} should use a safe internal app route`,
      );
    }
  }
}

function main() {
  assert.deepEqual(
    buildChatEmptySuggestions({
      ...baseStatus,
      indexSkillCount: 0,
      indexStatus: "missing",
    }),
    [],
    "empty workspaces should not show generic prompt chips that imply chat is useful",
  );

  assert.deepEqual(
    ids(
      buildChatEmptyActions({
        ...baseStatus,
        indexSkillCount: 0,
        indexStatus: "missing",
      }),
    ),
    ["guided-builder", "skills-library", "export-diagnostics"],
    "empty workspaces should guide users to create or import skills before rebuilding",
  );

  assert.deepEqual(
    buildChatEmptySuggestions({
      ...baseStatus,
      suggestedQuestions: ["How should I use release-notes?"],
    }),
    ["How should I use release-notes?"],
  );

  assert.deepEqual(
    ids(
      buildChatEmptyActions({
        ...baseStatus,
        indexStatus: "stale",
      }),
    ),
    ["rebuild-index", "export-diagnostics"],
    "stale indexed workspaces should prioritize rebuilding the existing index",
  );
  const staleActions = buildChatEmptyActions({
    ...baseStatus,
    indexStatus: "stale",
  });
  assert.equal(
    actionById(staleActions, "export-diagnostics")?.href,
    "/export?diagnostics=true",
    "index maintenance path should keep diagnostics export query",
  );

  assert.deepEqual(
    ids(
      buildChatEmptyActions({
        ...baseStatus,
        canSend: false,
      }),
    ),
    ["settings", "export-diagnostics"],
    "blocked provider/auth state should prioritize settings and diagnostics",
  );
  const blockedActions = buildChatEmptyActions({
    ...baseStatus,
    canSend: false,
  });
  assert.equal(
    actionById(blockedActions, "export-diagnostics")?.href,
    "/export?diagnostics=true",
    "non-failed blocked state should point to diagnostics export",
  );

  assert.deepEqual(
    ids(
      buildChatEmptyActions({
        ...baseStatus,
        canSend: false,
        indexStatus: "failed",
      }),
    ),
    ["settings", "rebuild-index", "export-diagnostics"],
    "blocked index failures should include a rebuild action",
  );
  const failedActions = buildChatEmptyActions({
    ...baseStatus,
    canSend: false,
    indexStatus: "failed",
  });
  assert.equal(
    actionById(failedActions, "export-diagnostics")?.href,
    "/export?diagnostics=true",
    "diagnostics action should deep-link to diagnostics export",
  );

  assert.deepEqual(
    ids(
      buildChatEmptyActions({
        ...baseStatus,
        hasStatusError: true,
      }),
    ),
    ["settings", "export-diagnostics"],
    "unavailable chat status should point to settings and diagnostics",
  );
  const statusErrorActions = buildChatEmptyActions({
    ...baseStatus,
    hasStatusError: true,
    canSend: true,
  });
  assert.equal(
    actionById(statusErrorActions, "export-diagnostics")?.href,
    "/export?diagnostics=true",
    "status-error state should point to diagnostics export",
  );

  const emptyIndexActions = buildChatEmptyActions({
    ...baseStatus,
    indexSkillCount: 0,
    indexStatus: "missing",
  });
  assert.equal(
    actionById(emptyIndexActions, "export-diagnostics")?.href,
    "/export?diagnostics=true",
    "empty index should keep diagnostics export query",
  );
  assertActionRoutes(emptyIndexActions);
  assertActionRoutes(staleActions);
  assertActionRoutes(blockedActions);
  assertActionRoutes(failedActions);
  assertActionRoutes(statusErrorActions);

  assert.deepEqual(
    buildChatReadinessActionVisibility({
      canSend: false,
      indexStatus: "stale",
    }),
    {
      showIndexAlert: false,
      showComposerIndexAction: false,
    },
    "provider/auth blockers should suppress secondary stale-index actions",
  );

  assert.deepEqual(
    buildChatReadinessActionVisibility({
      canSend: true,
      indexStatus: "stale",
    }),
    {
      showIndexAlert: true,
      showComposerIndexAction: true,
    },
    "non-blocking stale indexes should still offer rebuild actions",
  );

  assert.deepEqual(
    buildChatReadinessActionVisibility({
      canSend: false,
      indexStatus: "failed",
    }),
    {
      showIndexAlert: true,
      showComposerIndexAction: true,
    },
    "index failures should remain visible because they are the blocking cause",
  );

  console.log("Chat empty state helper tests passed");
}

main();
