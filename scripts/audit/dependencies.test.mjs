import assert from "node:assert/strict";
import { analyzeAudit } from "./dependencies.mjs";

const acceptedReport = {
  vulnerabilities: {
    braces: {
      severity: "high",
      via: [
        {
          severity: "high",
          url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
        },
      ],
    },
    micromatch: { severity: "high", via: ["braces"] },
    "fast-glob": { severity: "high", via: ["micromatch"] },
  },
};

assert.deepEqual(
  analyzeAudit(acceptedReport).blocked,
  [],
  "the exact documented advisory and its transitive chains should be accepted",
);
assert.equal(analyzeAudit(acceptedReport).accepted.length, 3);

const unknownReport = structuredClone(acceptedReport);
unknownReport.vulnerabilities.braces.via[0].url =
  "https://github.com/advisories/GHSA-unknown";
assert.deepEqual(
  analyzeAudit(unknownReport).blocked.map(({ name }) => name).sort(),
  ["braces", "fast-glob", "micromatch"],
  "an unknown advisory must fail closed along with every dependent chain",
);

const unrelatedReport = structuredClone(acceptedReport);
unrelatedReport.vulnerabilities.unrelated = {
  severity: "moderate",
  via: [{ severity: "moderate", url: "https://example.invalid/advisory" }],
};
assert.deepEqual(
  analyzeAudit(unrelatedReport).blocked.map(({ name }) => name),
  ["unrelated"],
  "an unrelated moderate advisory must remain blocking",
);

console.log("Dependency audit exception tests passed");
