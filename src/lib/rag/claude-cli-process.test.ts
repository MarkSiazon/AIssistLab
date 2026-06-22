import assert from "node:assert/strict";
import {
  buildVisibleLaunchCommand,
  buildClaudePromptArgs,
  cleanCliFailure,
  sanitizeCliOutput,
} from "./claude-cli-process";

assert.deepEqual(buildClaudePromptArgs("Reply OK"), [
  "-p",
  "Reply OK",
  "--safe-mode",
  "--tools",
  "",
  "--no-session-persistence",
  "--max-turns",
  "1",
  "--output-format",
  "text",
]);

assert.deepEqual(buildClaudePromptArgs("Reply OK", "Use concise answers.").slice(-2), [
  "--system-prompt",
  "Use concise answers.",
]);

assert.equal(
  cleanCliFailure({
    code: 2,
    stdout: "",
    stderr: "failed",
    timedOut: false,
  }),
  "failed",
);

assert.equal(sanitizeCliOutput("plain output"), "plain output");

assert.deepEqual(
  buildVisibleLaunchCommand("C:\\Program Files\\Claude\\claude.exe", ["auth", "login"], "win32"),
  {
    command: "cmd.exe",
    args: [
      "/d",
      "/s",
      "/c",
      'start "Claude Login" "C:\\Program Files\\Claude\\claude.exe" "auth" "login"',
    ],
  },
);

assert.deepEqual(buildVisibleLaunchCommand("claude", ["auth", "login"], "linux"), {
  command: "claude",
  args: ["auth", "login"],
});

assert.throws(
  () => buildVisibleLaunchCommand("claude & echo bad", [], "win32"),
  /unsupported shell characters/i,
);
assert.throws(
  () => buildVisibleLaunchCommand("claude", ["auth", "login & echo bad"], "win32"),
  /unsupported shell characters/i,
);

console.log("Claude CLI process helper tests passed");
