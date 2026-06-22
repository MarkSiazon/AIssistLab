import assert from "node:assert/strict";

async function main() {
  const route = await import("./route-announcement");

  assert.equal(route.MAIN_CONTENT_ID, "main-content");

  assert.deepEqual(route.routeAnnouncementForPath("/skills"), {
    label: "Skills",
    announcement: "Skills loaded.",
  });
  assert.deepEqual(route.routeAnnouncementForPath("/chat"), {
    label: "RAG Chat",
    announcement: "RAG Chat loaded.",
  });
  assert.deepEqual(route.routeAnnouncementForPath("/editor/guided"), {
    label: "Guided Skill Builder",
    announcement: "Guided Skill Builder loaded.",
  });
  assert.deepEqual(route.routeAnnouncementForPath("/editor/customer-response"), {
    label: "Skill Editor",
    announcement: "Skill Editor loaded.",
  });
  assert.deepEqual(route.routeAnnouncementForPath("/settings?tab=provider#top"), {
    label: "Settings",
    announcement: "Settings loaded.",
  });
  assert.deepEqual(route.routeAnnouncementForPath(null), {
    label: "Skill Workshop",
    announcement: "Skill Workshop loaded.",
  });

  console.log("Route announcement tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
