import assert from "node:assert/strict";
import {
  buildSettingsWorkspaceProfile,
  deleteSettingsWorkspaceProfile,
  getSettingsWorkspaceProfileRows,
  parseSettingsWorkspaceProfiles,
  readSettingsWorkspaceProfilesFromStorage,
  upsertSettingsWorkspaceProfile,
  WORKSPACE_PROFILES_STORAGE_KEY,
  writeSettingsWorkspaceProfilesToStorage,
} from "./settings-workspace-profiles-panel";

const rows = getSettingsWorkspaceProfileRows({
  profiles: [
    {
      id: "profile-1",
      name: "Local Project",
      workspaceRoot: "C:\\workspace",
      skillsDir: ".claude/skills",
    },
  ],
  formatPath: (value) => value.replace("C:\\", "~/"),
});

assert.deepEqual(rows, [
  {
    id: "profile-1",
    name: "Local Project",
    workspaceDisplay: "~/workspace",
    skillsDirDisplay: ".claude/skills",
    title: "~/workspace | .claude/skills",
  },
]);

assert.deepEqual(
  parseSettingsWorkspaceProfiles(
    JSON.stringify([
      {
        id: "profile-1",
        name: "Local Project",
        workspaceRoot: "C:\\workspace",
        skillsDir: ".claude/skills",
      },
      {
        id: 2,
        name: "Invalid",
        workspaceRoot: "C:\\bad",
        skillsDir: ".claude/skills",
      },
    ]),
  ),
  [
    {
      id: "profile-1",
      name: "Local Project",
      workspaceRoot: "C:\\workspace",
      skillsDir: ".claude/skills",
    },
  ],
);
assert.deepEqual(parseSettingsWorkspaceProfiles("not json"), []);
assert.deepEqual(parseSettingsWorkspaceProfiles(null), []);

const storageProfile = {
  id: "stored",
  name: "Stored Project",
  workspaceRoot: "C:\\stored",
  skillsDir: ".claude/skills",
};
assert.deepEqual(
  readSettingsWorkspaceProfilesFromStorage({
    getItem: (key) =>
      key === WORKSPACE_PROFILES_STORAGE_KEY
        ? JSON.stringify([storageProfile])
        : null,
    setItem: () => undefined,
  }),
  [storageProfile],
  "storage reader should parse valid profile lists",
);
assert.deepEqual(
  readSettingsWorkspaceProfilesFromStorage({
    getItem: () => {
      throw new Error("storage disabled");
    },
    setItem: () => undefined,
  }),
  [],
  "storage reader should tolerate blocked browser storage",
);
assert.equal(
  writeSettingsWorkspaceProfilesToStorage(
    {
      getItem: () => null,
      setItem: () => undefined,
    },
    [storageProfile],
  ),
  true,
  "storage writer should report successful persistence",
);
assert.equal(
  writeSettingsWorkspaceProfilesToStorage(
    {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    },
    [storageProfile],
  ),
  false,
  "storage writer should report unavailable persistence",
);

const built = buildSettingsWorkspaceProfile({
  id: "profile-2",
  name: "  Local Project  ",
  workspaceRoot: "C:\\next",
  skillsDir: "",
});
assert.deepEqual(built, {
  id: "profile-2",
  name: "Local Project",
  workspaceRoot: "C:\\next",
  skillsDir: ".claude/skills",
});

assert.deepEqual(
  upsertSettingsWorkspaceProfile({
    profiles: [
      {
        id: "old",
        name: "local project",
        workspaceRoot: "C:\\old",
        skillsDir: ".claude/skills",
      },
    ],
    profile: built,
  }),
  [built],
);

assert.deepEqual(
  deleteSettingsWorkspaceProfile({
    profiles: [built],
    profileId: "profile-2",
  }),
  [],
);

console.log("Settings workspace profiles panel helper tests passed");
