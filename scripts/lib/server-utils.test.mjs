import assert from "node:assert/strict";
import { fetchWithTimeout, getFreePort, pushLog } from "./server-utils.mjs";

const port = await getFreePort();
assert.equal(Number.isInteger(port), true);
assert.equal(port > 0, true);

const lines = ["old-1", "old-2"];
pushLog(lines, "new-1\n\nnew-2\r\nnew-3", 4);
assert.deepEqual(lines, ["old-2", "new-1", "new-2", "new-3"]);

const response = await fetchWithTimeout("data:text/plain,ok", {}, 1000);
assert.equal(await response.text(), "ok");

console.log("Server utility tests passed");
