import assert from "node:assert/strict";
import {
  WINDOWS_FOLDER_PICKER_SCRIPT,
  buildWindowsFolderPickerArgs,
  nativeFolderPickerResultToResponse,
} from "./native-folder-picker";

async function main(): Promise<void> {
  const initialPath = "C:\\Temp Folder";
  const title = "Choose workspace";
  const args = buildWindowsFolderPickerArgs(initialPath, title);

  assert.deepEqual(args.slice(0, 5), [
    "-NoProfile",
    "-STA",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
  ]);
  assert.equal(args[5], WINDOWS_FOLDER_PICKER_SCRIPT);
  assert.equal(args[6], initialPath);
  assert.equal(args[7], title);
  assert.equal(WINDOWS_FOLDER_PICKER_SCRIPT.includes(initialPath), false);
  assert.equal(WINDOWS_FOLDER_PICKER_SCRIPT.includes(title), false);

  assert.deepEqual(
    nativeFolderPickerResultToResponse({
      code: 0,
      stdout: "C:\\Selected\\Folder\r\n",
      stderr: "",
      timedOut: false,
    }),
    { status: 200, body: { path: "C:\\Selected\\Folder" } },
  );

  assert.deepEqual(
    nativeFolderPickerResultToResponse({
      code: 0,
      stdout: "\r\nC:\\Selected\\Nested Folder\r\n",
      stderr: "",
      timedOut: false,
    }),
    { status: 200, body: { path: "C:\\Selected\\Nested Folder" } },
  );

  assert.deepEqual(
    nativeFolderPickerResultToResponse({
      code: 0,
      stdout: "\r\n",
      stderr: "",
      timedOut: false,
    }),
    {
      status: 500,
      body: { error: "Native folder picker returned an empty path." },
    },
  );

  assert.deepEqual(
    nativeFolderPickerResultToResponse({
      code: 2,
      stdout: "",
      stderr: "",
      timedOut: false,
    }),
    { status: 200, body: { cancelled: true } },
  );

  assert.deepEqual(
    nativeFolderPickerResultToResponse({
      code: null,
      stdout: "",
      stderr: "",
      timedOut: true,
    }),
    { status: 408, body: { error: "Native folder picker timed out." } },
  );

  assert.deepEqual(
    nativeFolderPickerResultToResponse({
      code: null,
      stdout: "",
      stderr: "",
      timedOut: false,
      error: "spawn ENOENT",
    }),
    { status: 500, body: { error: "Native folder picker could not start." } },
  );

  assert.deepEqual(
    nativeFolderPickerResultToResponse({
      code: 1,
      stdout: "",
      stderr: "dialog failed",
      timedOut: false,
    }),
    { status: 500, body: { error: "Native folder picker could not open." } },
  );

  console.log("Native folder picker helper tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
