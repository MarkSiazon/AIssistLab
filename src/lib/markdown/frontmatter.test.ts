import assert from "node:assert/strict";
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter";

async function main(): Promise<void> {
  const parsed = parseFrontmatter(
    [
      "---",
      "description: Keep metadata",
      "tags: [alpha, beta]",
      "user-invocable: true",
      "nested:",
      "  enabled: true",
      "---",
      "",
      "## Instructions",
      "",
      "Use this skill carefully.",
    ].join("\n"),
  );

  assert.equal(parsed.data.description, "Keep metadata");
  assert.deepEqual(parsed.data.tags, ["alpha", "beta"]);
  assert.equal(parsed.data["user-invocable"], true);
  assert.deepEqual(parsed.data.nested, { enabled: true });
  assert.match(parsed.content.trimStart(), /^## Instructions/);
  assert.equal(parsed.error, undefined);

  const noFrontmatter = parseFrontmatter("## Plain markdown\n");
  assert.deepEqual(noFrontmatter.data, {});
  assert.equal(noFrontmatter.content, "## Plain markdown\n");

  const arrayFrontmatter = parseFrontmatter(["---", "- not", "- an object", "---", "Body"].join("\n"));
  assert.deepEqual(arrayFrontmatter.data, {});
  assert.equal(arrayFrontmatter.content, "Body");
  assert.equal(arrayFrontmatter.error, "Frontmatter YAML must be an object.");

  const malformedFrontmatter = parseFrontmatter(
    ["---", "description: [broken", "---", "## Body"].join("\n"),
  );
  assert.deepEqual(malformedFrontmatter.data, {});
  assert.equal(malformedFrontmatter.content, "## Body");
  assert.equal(
    malformedFrontmatter.error,
    "Frontmatter YAML could not be parsed.",
  );

  const serialized = stringifyFrontmatter("## Body\n", {
    description: "Serialized metadata",
    tags: ["one", "two"],
    optional: undefined,
  });
  assert.equal(serialized.includes("optional:"), false);
  const roundTrip = parseFrontmatter(serialized);
  assert.equal(roundTrip.data.description, "Serialized metadata");
  assert.deepEqual(roundTrip.data.tags, ["one", "two"]);
  assert.equal(roundTrip.content, "## Body\n");

  console.log("Frontmatter helper tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
