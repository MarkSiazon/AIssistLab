import assert from "node:assert/strict";
import path from "node:path";
import {
  collectAppRouterRouteFiles,
  readSource,
  relativeSourcePath,
} from "@/lib/test-utils/static-source";

const methodExportPattern =
  /export\s+(?:async\s+function|function|const)\s+(GET|POST|PUT|DELETE|PATCH)\b/g;
const destructuredMethodExportPattern =
  /export\s+const\s+\{\s*([^}]+)\s*\}\s*=/g;
const documentedEndpointPattern =
  /`(GET|POST|PUT|DELETE|PATCH)\s+((?:\/api\/)[^`?\s]+)`/g;
const apiMethods = new Set(["GET", "POST", "PUT", "DELETE", "PATCH"]);

function apiRouteMethods(filePath: string): string[] {
  const source = readSource(filePath);
  const methods = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = methodExportPattern.exec(source))) {
    methods.add(match[1]);
  }

  while ((match = destructuredMethodExportPattern.exec(source))) {
    for (const name of match[1].split(",")) {
      const method = name.trim().split(/\s*:\s*/)[0];
      if (apiMethods.has(method)) methods.add(method);
    }
  }

  assert.notEqual(
    methods.size,
    0,
    `${relativeSourcePath(filePath)} should export at least one API route method`,
  );

  return [...methods].sort();
}

function documentedApiEndpoints(markdown: string): string[] {
  const endpoints = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = documentedEndpointPattern.exec(markdown))) {
    endpoints.add(`${match[1]} ${match[2]}`);
  }

  return [...endpoints].sort();
}

const actualEndpoints = collectAppRouterRouteFiles(
  "src/app/api",
  ".ts",
  "route.ts",
)
  .flatMap(({ filePath, route }) =>
    apiRouteMethods(filePath).map((method) => `${method} ${route}`),
  )
  .sort();

const inventory = readSource(
  path.join(process.cwd(), "docs", "v1-roadmap", "current-feature-inventory.md"),
);

assert.deepEqual(
  documentedApiEndpoints(inventory),
  actualEndpoints,
  "docs/v1-roadmap/current-feature-inventory.md should list every current API route method",
);

console.log("V1 API inventory documentation tests passed");
