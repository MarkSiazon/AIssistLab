import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  auditDocsLinks,
  docsFiles,
  extractMarkdownLinks,
  markdownAnchorForHeading,
  markdownAnchors,
} from "./docs.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const verifyReleaseSource = readFileSync("scripts/release/verify.mjs", "utf8");

assert.equal(
  packageJson.scripts["audit:docs"],
  "node scripts/audit/docs.mjs",
  "package.json must expose the documentation audit",
);

assert.match(
  verifyReleaseSource,
  /Documentation link audit[\s\S]*audit:docs/,
  "verify:release must run the documentation link audit",
);

assert.deepEqual(
  docsFiles(["README.md", "docs/README.md", "src/app/page.tsx"]),
  ["README.md", "docs/README.md"],
  "docs audit should only scan README and docs markdown files",
);

assert.deepEqual(
  extractMarkdownLinks(
    "[Local](docs/README.md) ![Image](docs/assets/a.png) [Web](https://example.com)",
  ).map((link) => link.href),
  ["docs/README.md", "docs/assets/a.png", "https://example.com"],
  "docs audit should parse inline markdown links and images",
);

assert.equal(
  markdownAnchorForHeading("Release Evidence & Privacy Gate!"),
  "release-evidence-privacy-gate",
  "heading anchors should match common markdown slug behavior",
);

assert.deepEqual(
  [...markdownAnchors("# Title\n\n## Release Evidence")],
  ["title", "release-evidence"],
  "docs audit should collect markdown heading anchors",
);

const files = [
  "README.md",
  "docs/guide.md",
  "docs/assets/screenshot.png",
  "docs/missing-anchor.md",
];
const text = new Map([
  [
    "README.md",
    [
      "[Guide](docs/guide.md#setup)",
      "![Screenshot](docs/assets/screenshot.png)",
      "[External](https://example.com/no-check)",
      "[Missing](docs/missing.md)",
      "[Missing anchor](docs/missing-anchor.md#not-there)",
    ].join("\n"),
  ],
  ["docs/guide.md", "## Setup"],
  ["docs/missing-anchor.md", "## Existing"],
]);

assert.deepEqual(
  auditDocsLinks(
    files,
    (file) => text.get(file) ?? "",
    (file) => files.includes(file),
  ),
  [
    "README.md:4 links to missing docs/missing.md",
    "README.md:5 links to missing #not-there in docs/missing-anchor.md",
  ],
  "docs audit should flag missing local targets and anchors",
);

console.log("Documentation link audit tests passed");
