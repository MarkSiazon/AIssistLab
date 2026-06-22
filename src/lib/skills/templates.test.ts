import assert from "node:assert/strict";

async function main() {
  const templates = await import("./templates");

  const all = templates.listSkillTemplates();
  assert.equal(all.length, 5);
  assert.deepEqual(
    all.map((item) => item.category).sort(),
    ["command", "learning", "reference", "subagent", "workflow"],
  );

  for (const template of all) {
    assert.match(template.id, /^[a-z0-9-]+$/);
    assert.equal(typeof template.label, "string");
    assert.equal(template.label.length > 0, true);
    assert.equal(typeof template.description, "string");
    assert.equal(template.description.length > 20, true);
    assert.equal(typeof template.initialFrontmatter.description, "string");
    assert.equal(
      (template.initialFrontmatter.description as string).length > 20,
      true,
    );
    assert.equal(template.initialBody.includes("##"), true);
  }

  const learning = templates.getSkillTemplate("learning-rubric");
  assert.equal(learning?.category, "learning");
  assert.equal(
    String(learning?.initialBody).includes("Rubric"),
    true,
  );

  assert.equal(templates.getSkillTemplate("../secret"), null);

  console.log("Skill template tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
