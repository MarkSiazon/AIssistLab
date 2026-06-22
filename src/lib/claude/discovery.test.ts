import assert from "node:assert/strict";
import path from "node:path";
import {
  buildClaudeExecutableCandidates,
  buildClaudeLoginCandidates,
  discoverClaudeProfileState,
  discoverClaudeProfiles,
  expandUserPath,
  resolveClaudeProfileSelection,
  sanitizeClaudeDisplayText,
  toPortableHomePath,
} from "./discovery";

const userName = ["Example", "User"].join(" ");
const home = path.win32.join("C:\\Users", userName);
const env = {
  USERPROFILE: home,
  HOME: home,
};

function assertSanitized(value: string): void {
  assert.equal(value.includes(home), false, "full home path leaked");
  assert.equal(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value),
    false,
    "email leaked",
  );
  assert.equal(/sk-ant-[A-Za-z0-9_-]+/.test(value), false, "API key leaked");
  assert.equal(/ExampleCorp/.test(value), false, "organization leaked");
}

async function main(): Promise<void> {
  assert.equal(
    expandUserPath("~\\.claude-profiles\\work", env),
    path.win32.join(home, ".claude-profiles", "work"),
  );
  assert.equal(
    expandUserPath("%USERPROFILE%\\.claude", env),
    path.win32.join(home, ".claude"),
  );
  assert.equal(
    expandUserPath("$HOME\\.claude", env),
    path.win32.join(home, ".claude"),
  );
  assert.equal(
    expandUserPath("${HOME}\\.claude", env),
    path.win32.join(home, ".claude"),
  );
  assert.equal(
    toPortableHomePath(path.win32.join(home, ".claude-profiles", "work"), env),
    "~\\.claude-profiles\\work",
  );

  const explicitCli = path.win32.join(home, "tools", "claude.exe");
  assert.deepEqual(
    buildClaudeExecutableCandidates(explicitCli, env).map((item) => item.source),
    ["env"],
  );
  assert.deepEqual(
    buildClaudeExecutableCandidates("auto", env).map((item) => item.source),
    ["native-install", "path"],
  );
  assertSanitized(
    buildClaudeExecutableCandidates("auto", env)[0].displayCommand,
  );

  const nativeClaude = path.win32.join(home, "tools", "claude.exe");
  const loginCandidates = buildClaudeLoginCandidates(
    "auto",
    nativeClaude,
    env,
  );
  assert.deepEqual(
    loginCandidates.map((item) => item.source),
    ["sibling", "sibling", "sibling", "sibling", "user-bin", "path"],
  );
  assert.equal(loginCandidates.at(-1)?.command, "claude-login");
  for (const candidate of loginCandidates) {
    assertSanitized(candidate.displayCommand);
  }

  const explicitHelper = path.win32.join(home, "bin", "custom-login.cmd");
  assert.deepEqual(
    buildClaudeLoginCandidates(explicitHelper, nativeClaude, env).map(
      (item) => item.source,
    ),
    ["env"],
  );

  const profileRoot = path.win32.join(home, ".claude-profiles");
  const profiles = await discoverClaudeProfiles({
    configuredConfigDir: "~\\.claude-profiles\\beta",
    env,
    exists: async (candidate) =>
      candidate === path.win32.join(home, ".claude") ||
      candidate.startsWith(profileRoot),
    readDirNames: async (candidate) =>
      candidate === profileRoot ? ["beta", "alpha"] : [],
  });

  assert.deepEqual(
    profiles.map((profile) => profile.label),
    ["Default profile", "Profile 1", "Profile 2"],
  );
  assert.equal(
    profiles.every((profile) => !profile.label.includes("alpha")),
    true,
  );
  assert.equal(
    profiles.every((profile) => !profile.label.includes("beta")),
    true,
  );
  assert.equal(
    profiles.find((profile) => profile.selected)?.label,
    "Profile 2",
  );
  assert.equal(JSON.stringify(profiles).includes("beta"), false);
  assert.equal(JSON.stringify(profiles).includes("envValue"), false);
  assert.equal(
    profiles.every((profile) => !profile.displayPath.includes(home)),
    true,
  );

  const manualProfiles = await discoverClaudeProfiles({
    configuredConfigDir: "%USERPROFILE%\\.other-claude",
    env,
    exists: async () => false,
    readDirNames: async () => [],
  });
  assert.equal(manualProfiles.at(-1)?.label, "Manual profile");
  assert.equal(manualProfiles.at(-1)?.selected, true);
  assert.equal(manualProfiles.at(-1)?.displayPath, "~\\.other-claude");

  const email = ["person", "example.com"].join("@");
  const secretText = [
    path.win32.join(home, ".claude", "oauth.json"),
    path.win32.join(home, ".claude-profiles", "plain-work-profile"),
    email,
    "sk-ant-private-test-value",
    "Organization: ExampleCorp",
  ].join("\n");
  const sanitizedSecretText = sanitizeClaudeDisplayText(secretText, env);
  assertSanitized(sanitizedSecretText);
  assert.equal(sanitizedSecretText.includes("plain-work-profile"), false);
  assert.equal(
    sanitizedSecretText.includes("~\\.claude-profiles\\<hidden>"),
    true,
  );

  const sensitiveProfileName = [
    "work",
    email,
    "ExampleCorp",
    "sk-ant-private-test-value",
  ].join("-");
  const privateProfilePath = path.win32.join(
    profileRoot,
    sensitiveProfileName,
  );
  const privateState = await discoverClaudeProfileState({
    configuredConfigDir: privateProfilePath,
    env,
    exists: async (candidate) =>
      candidate === path.win32.join(home, ".claude") ||
      candidate === privateProfilePath,
    readDirNames: async (candidate) =>
      candidate === profileRoot ? [sensitiveProfileName] : [],
  });
  const publicProfileJson = JSON.stringify(privateState.profiles);
  assertSanitized(publicProfileJson);
  assert.equal(publicProfileJson.includes(sensitiveProfileName), false);
  assert.equal(publicProfileJson.includes("envValue"), false);
  assert.equal(publicProfileJson.includes(privateProfilePath), false);

  const selectedPrivateProfile = privateState.selectedProfile;
  assert.ok(selectedPrivateProfile.id.startsWith("profile-"));
  const resolvedPrivateProfile = await resolveClaudeProfileSelection(
    { profileId: selectedPrivateProfile.id },
    {
      configuredConfigDir: "",
      env,
      exists: async (candidate) =>
        candidate === path.win32.join(home, ".claude") ||
        candidate === privateProfilePath,
      readDirNames: async (candidate) =>
        candidate === profileRoot ? [sensitiveProfileName] : [],
    },
  );
  assert.equal(
    resolvedPrivateProfile.internalProfile.absoluteConfigDir,
    privateProfilePath,
  );
  assert.equal(
    resolvedPrivateProfile.internalProfile.portableConfigDir,
    `~\\.claude-profiles\\${sensitiveProfileName}`,
  );
  assertSanitized(JSON.stringify(resolvedPrivateProfile.publicProfile));
}

main()
  .then(() => {
    console.log("Claude discovery tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
