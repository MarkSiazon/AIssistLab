export async function fulfillJson(route, payload, { status = 200 } = {}) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}

export async function fulfillEventStream(route, body) {
  await route.fulfill({
    contentType: "text/event-stream",
    body,
  });
}

export async function fulfillAttachment(route, { contentType, filename, body }) {
  await route.fulfill({
    contentType,
    headers: {
      "content-disposition": `attachment; filename="${filename}"`,
    },
    body,
  });
}
