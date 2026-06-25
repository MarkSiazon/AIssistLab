import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export function collectFilesByExtension(
  directory: string,
  extension: string,
): string[] {
  const files: string[] = [];
  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesByExtension(fullPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  return files;
}

export function collectTsxFiles(...roots: string[]): string[] {
  return roots.flatMap((root) =>
    collectFilesByExtension(path.join(process.cwd(), root), ".tsx"),
  );
}

export function collectSourceFiles(
  roots: string[],
  extensions: string[],
): string[] {
  return roots.flatMap((root) =>
    extensions.flatMap((extension) =>
      collectFilesByExtension(
        path.isAbsolute(root) ? root : path.join(process.cwd(), root),
        extension,
      ),
    ),
  );
}

export function lineNumber(source: string, index: number): number {
  return source.slice(0, index).split(/\r?\n/).length;
}

export function relativeSourcePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

export function readSource(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}
