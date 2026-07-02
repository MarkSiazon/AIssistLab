import { runCommand } from "../lib/command.mjs";

runCommand("Project cleanup dry-run", "npm", ["run", "cleanup:project:dry-run"]);
runCommand("Local artifact cleanup dry-run", "npm", [
  "run",
  "cleanup:artifacts:dry-run",
]);
runCommand("Automated V1 release gate", "npm", ["run", "verify:release"]);
runCommand("Sanitized V1 release evidence", process.execPath, [
  "scripts/release/evidence.mjs",
  "--gate-result",
  "passed",
]);
