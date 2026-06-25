import assert from "node:assert/strict";

async function main() {
  const indexSummary = await import("./index-status-summary");

  assert.equal(indexSummary.indexStatusLabel("ready"), "Ready");
  assert.equal(indexSummary.indexStatusLabel("stale"), "Stale");
  assert.equal(indexSummary.indexStatusLabel("missing"), "Missing");
  assert.equal(indexSummary.indexStatusLabel("rebuilding"), "Rebuilding");
  assert.equal(indexSummary.indexStatusLabel("failed"), "Failed");
  assert.equal(indexSummary.indexStatusTitle("ready"), "Index ready");
  assert.equal(indexSummary.indexStatusTitle("failed"), "Index failed");

  assert.equal(indexSummary.indexStatusColor("ready"), "var(--green)");
  assert.equal(indexSummary.indexStatusColor("failed"), "var(--red)");
  assert.equal(indexSummary.indexStatusColor("stale"), "var(--yellow)");
  assert.equal(
    indexSummary.indexCountsLabel({ skillCount: 1, chunkCount: 2 }),
    "1 skill / 2 chunks",
  );
  assert.equal(
    indexSummary.indexRebuiltMessage({ skillCount: 1, chunkCount: 2 }),
    "Index rebuilt with 1 skill and 2 chunks.",
  );
  assert.equal(
    indexSummary.indexStatusUpdateMessage({
      status: "ready",
      skillCount: 1,
      chunkCount: 2,
      staleReason: null,
      error: null,
    }),
    "Index ready: 1 skill, 2 chunks.",
  );
  assert.equal(
    indexSummary.indexSuggestedAction({ status: "failed" }),
    "Fix the index error, then rebuild.",
  );
  assert.equal(
    indexSummary.indexSuggestedAction({ status: "rebuilding" }),
    "Wait for rebuild to finish.",
  );
  assert.equal(
    indexSummary.indexSuggestedAction({ status: "stale" }),
    "Rebuild Index before relying on citations.",
  );

  assert.equal(
    indexSummary.indexStatusAnnouncement(null, true, null),
    "RAG index status: checking index.",
  );
  assert.equal(
    indexSummary.indexStatusAnnouncement(null, false, "Status check failed"),
    "RAG index status unavailable. Status check failed",
  );
  assert.equal(
    indexSummary.indexStatusAnnouncement(
      {
        status: "stale",
        skillCount: 2,
        chunkCount: 17,
        staleReason: "Skills changed after last rebuild.",
        error: null,
      },
      false,
      null,
    ),
    "RAG index status: Stale. Last index had 2 skills, 17 chunks. Note: Skills changed after last rebuild.",
  );
  assert.equal(
    indexSummary.indexStatusCountsLabel({
      status: "stale",
      skillCount: 2,
      chunkCount: 17,
      staleReason: "Skills changed after last rebuild.",
      error: null,
    }),
    "Last index: 2 skills / 17 chunks",
  );
  assert.equal(
    indexSummary.indexStatusCountsLabel({
      status: "ready",
      skillCount: 1,
      chunkCount: 1,
      staleReason: null,
      error: null,
    }),
    "1 skill / 1 chunk",
  );

  const unavailableAnnouncement = indexSummary.indexStatusAnnouncement(
    null,
    false,
    "Unable to load index status.",
  );
  assert.doesNotMatch(unavailableAnnouncement, /Retry status/i);
  assert.doesNotMatch(unavailableAnnouncement, /UnavailableStatus/);

  console.log("Index status summary tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
