export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

function safeDownloadFilename(filename: string): string {
  return filename
    .replace(/[\x00-\x1f\x7f"\\/]/g, "_")
    .replace(/[:*?<>|;]/g, "_");
}

export function textDownloadResponse(
  content: string,
  filename: string,
  contentType = "text/plain",
): Response {
  return new Response(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeDownloadFilename(filename)}"`,
    },
  });
}
