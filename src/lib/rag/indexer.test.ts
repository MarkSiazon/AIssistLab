import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// Hosted Node runtimes may disable synchronous require(ESM). Loading TF-IDF
// must not initialize natural's unrelated ESM-backed sentiment analyzers.
const result = spawnSync(
  process.execPath,
  [
    "--no-experimental-require-module",
    "--import",
    "tsx",
    "-e",
    `
      const assert = require('node:assert/strict');
      const { buildIndex } = require('./src/lib/rag/indexer.ts');
      const index = buildIndex([{
        name: 'release-readiness',
        frontmatter: { description: 'Release readiness checks' },
        body: '# Release readiness\\nVerify release readiness with local checks.',
      }]);
      assert.equal(index.skillMap.size, 1);
      assert.ok(index.chunks.length > 0);
      assert.ok(index.tfidf.tfidf('release', 0) > 0);
      assert.equal(Object.keys(require.cache).some(
        file => /[\\\\/]afinn-165[\\\\/]|[\\\\/]sentiment[\\\\/]/.test(file)
      ), false);
    `,
  ],
  { encoding: "utf8", timeout: 30000, windowsHide: true },
);

assert.ifError(result.error);
assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
console.log("TF-IDF hosted-runtime compatibility tests passed");
