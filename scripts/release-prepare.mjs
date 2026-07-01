import { spawnSync } from "node:child_process";

function runCommand(label, command, args) {
  console.log(`\n==> ${label}`);
  const result =
    process.platform === "win32" && command === "npm"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", ["npm", ...args].join(" ")], {
          stdio: "inherit",
        })
      : spawnSync(command, args, {
          stdio: "inherit",
        });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runCommand("Project cleanup dry-run", "npm", ["run", "cleanup:project:dry-run"]);
runCommand("Local artifact cleanup dry-run", "npm", [
  "run",
  "cleanup:artifacts:dry-run",
]);
runCommand("Automated V1 release gate", "npm", ["run", "verify:release"]);
runCommand("Sanitized V1 release evidence", process.execPath, [
  "scripts/export-release-evidence.mjs",
  "--gate-result",
  "passed",
]);
