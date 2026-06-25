import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { trackBrowserIssues } from "./browser-issues.mjs";

const page = new EventEmitter();
const browserIssues = [];

trackBrowserIssues(page, browserIssues, {
  consumeIssue: (issue) =>
    /^pageerror: expected page error$/.test(issue) ||
    /^http 500: http:\/\/127\.0\.0\.1\/expected-error$/.test(issue),
  ignoreConsoleError: (text) => /status of 403/.test(text),
});

page.emit("pageerror", { message: "expected page error" });
page.emit("pageerror", { message: "unexpected page error" });
page.emit("console", {
  type: () => "warning",
  text: () => "warning",
});
page.emit("console", {
  type: () => "error",
  text: () => "Failed to load resource: the server responded with a status of 403",
});
page.emit("console", {
  type: () => "error",
  text: () => "Unexpected console error",
});
page.emit("response", {
  status: () => 404,
  url: () => "http://127.0.0.1/not-found",
});
page.emit("response", {
  status: () => 500,
  url: () => "http://127.0.0.1/expected-error",
});
page.emit("response", {
  status: () => 500,
  url: () => "http://127.0.0.1/error",
});

assert.deepEqual(browserIssues, [
  "pageerror: unexpected page error",
  "console: Unexpected console error",
  "http 500: http://127.0.0.1/error",
]);

console.log("Browser issue tracking tests passed");
