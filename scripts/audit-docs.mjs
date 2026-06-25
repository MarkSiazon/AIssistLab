#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  listExistingTrackedAndVisibleUntrackedFiles,
  readRepoTextFile,
} from "./lib/repo-files.mjs";

const externalLinkPattern = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export function docsFiles(files) {
  return files.filter(
    (file) => file === "README.md" || (file.startsWith("docs/") && file.endsWith(".md")),
  );
}

export function extractMarkdownLinks(markdown) {
  const links = [];
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(markdown))) {
    const rawHref = match[1].trim();
    if (!rawHref) continue;
    const href = rawHref.startsWith("<")
      ? rawHref.slice(1, rawHref.indexOf(">"))
      : rawHref.split(/\s+/)[0];
    links.push({ href, offset: match.index });
  }
  return links;
}

function markdownLineForOffset(markdown, offset) {
  return markdown.slice(0, offset).split(/\r?\n/).length;
}

export function markdownAnchorForHeading(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\]().,!?'"<>:;/\\|{}]/g, "")
    .replace(/&/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function markdownAnchors(markdown) {
  const anchors = new Set();
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) anchors.add(markdownAnchorForHeading(match[2]));
  }
  return anchors;
}

function splitHref(href) {
  const [withoutQuery] = href.split("?");
  const hashIndex = withoutQuery.indexOf("#");
  if (hashIndex === -1) {
    return { pathname: decodeURIComponent(withoutQuery), anchor: "" };
  }
  return {
    pathname: decodeURIComponent(withoutQuery.slice(0, hashIndex)),
    anchor: decodeURIComponent(withoutQuery.slice(hashIndex + 1)),
  };
}

function isIgnoredHref(href) {
  return externalLinkPattern.test(href);
}

function resolveTargetPath(sourceFile, pathname) {
  const baseDirectory = path.posix.dirname(sourceFile);
  const resolved = pathname.startsWith("/")
    ? pathname.slice(1)
    : path.posix.normalize(path.posix.join(baseDirectory, pathname));
  return resolved === "." ? sourceFile : resolved;
}

export function auditDocsLinks(files, readTextFile, fileExists) {
  const markdownFiles = docsFiles(files);
  const issues = [];
  const anchorCache = new Map();

  for (const sourceFile of markdownFiles) {
    const markdown = readTextFile(sourceFile);
    for (const link of extractMarkdownLinks(markdown)) {
      if (isIgnoredHref(link.href)) continue;
      const { pathname, anchor } = splitHref(link.href);
      const targetPath = resolveTargetPath(sourceFile, pathname);
      const line = markdownLineForOffset(markdown, link.offset);

      if (!fileExists(targetPath)) {
        issues.push(`${sourceFile}:${line} links to missing ${targetPath}`);
        continue;
      }

      if (anchor && targetPath.endsWith(".md")) {
        if (!anchorCache.has(targetPath)) {
          anchorCache.set(targetPath, markdownAnchors(readTextFile(targetPath)));
        }
        if (!anchorCache.get(targetPath).has(anchor)) {
          issues.push(
            `${sourceFile}:${line} links to missing #${anchor} in ${targetPath}`,
          );
        }
      }
    }
  }

  return issues;
}

function main() {
  const files = listExistingTrackedAndVisibleUntrackedFiles();
  const fileSet = new Set(files);
  const issues = auditDocsLinks(
    files,
    readRepoTextFile,
    (file) => fileSet.has(file),
  );

  if (issues.length === 0) {
    console.log("Documentation links are valid.");
    return;
  }

  console.error("Documentation link issues found:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
