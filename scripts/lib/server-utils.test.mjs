import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  fetchWithTimeout,
  getFreePort,
  pushLog,
  waitForServerReady,
} from "./server-utils.mjs";

const port = await getFreePort();
assert.equal(Number.isInteger(port), true);
assert.equal(port > 0, true);

const lines = ["old-1", "old-2"];
pushLog(lines, "new-1\n\nnew-2\r\nnew-3", 4);
assert.deepEqual(lines, ["old-2", "new-1", "new-2", "new-3"]);

const response = await fetchWithTimeout("data:text/plain,ok", {}, 1000);
assert.equal(await response.text(), "ok");

const readyPort = await getFreePort();
const readyServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ok");
    return;
  }
  response.writeHead(404, { "content-type": "text/plain" });
  response.end("missing");
});
await new Promise((resolve, reject) => {
  readyServer.once("error", reject);
  readyServer.listen(readyPort, "127.0.0.1", resolve);
});
try {
  await waitForServerReady({
    baseUrl: `http://127.0.0.1:${readyPort}`,
    child: { exitCode: null },
    logs: [],
    probePath: "/health",
    serverName: "test server",
    timeoutMs: 2000,
    probeTimeoutMs: 500,
  });
} finally {
  await new Promise((resolve) => readyServer.close(resolve));
}

console.log("Server utility tests passed");
