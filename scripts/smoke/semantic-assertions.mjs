function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function routeSemanticIssues(snapshot, scope) {
  const issues = [];

  if (snapshot.mainLandmarkCount !== 1) {
    issues.push(
      `${scope} should have exactly one visible main landmark, found ${snapshot.mainLandmarkCount}`,
    );
  }

  if (snapshot.visibleH1Texts.length !== 1) {
    issues.push(
      `${scope} should have exactly one visible h1, found ${snapshot.visibleH1Texts.length}: ${snapshot.visibleH1Texts.join(
        " | ",
      )}`,
    );
  }

  if (snapshot.visibleHeadingLevels.length > 0 && snapshot.visibleHeadingLevels[0] !== 1) {
    issues.push(
      `${scope} first visible heading should be h1, found h${snapshot.visibleHeadingLevels[0]}`,
    );
  }

  for (let index = 1; index < snapshot.visibleHeadingLevels.length; index += 1) {
    const previous = snapshot.visibleHeadingLevels[index - 1];
    const current = snapshot.visibleHeadingLevels[index];
    if (current > previous + 1) {
      issues.push(
        `${scope} skips heading level from h${previous} to h${current}`,
      );
    }
  }

  for (const id of snapshot.duplicateIds) {
    issues.push(`${scope} has duplicate id #${id}`);
  }

  for (const reference of snapshot.brokenAriaReferences) {
    issues.push(
      `${scope} ${reference.attribute} references missing #${reference.targetId} on ${reference.descriptor}`,
    );
  }

  for (const control of snapshot.focusableNameIssues) {
    issues.push(`${scope} focusable control is missing a name: ${control}`);
  }

  for (const control of snapshot.hiddenFocusableIssues) {
    issues.push(`${scope} aria-hidden element remains focusable: ${control}`);
  }

  for (const link of snapshot.linkTargetIssues) {
    issues.push(`${scope} link target issue: ${link}`);
  }

  return issues;
}

export function assertRouteSemanticSnapshot(snapshot, scope) {
  const issues = routeSemanticIssues(snapshot, scope);
  assert(issues.length === 0, `Route semantic issues:\n${issues.join("\n")}`);
  return snapshot;
}

export async function assertRouteSemanticState(page, scope) {
  const snapshot = await page.evaluate(() => {
    function isFrameworkInjected(element) {
      const id = element.getAttribute("id") ?? "";
      return id.startsWith("next-") || Boolean(element.closest("[data-nextjs-toast]"));
    }

    function isVisible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    function descriptorFor(element) {
      const tag = element.tagName.toLowerCase();
      const id = element.getAttribute("id");
      const className =
        typeof element.className === "string" ? element.className : "";
      const text = (element.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 70);
      return `${tag}${id ? `#${id}` : ""}${
        className
          ? `.${className
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 3)
              .join(".")}`
          : ""
      }${text ? ` "${text}"` : ""}`;
    }

    function textForIds(ids) {
      return ids
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function labelFor(element) {
      const id = element.getAttribute("id");
      if (!id) return "";
      const label = Array.from(document.querySelectorAll("label")).find(
        (candidate) => candidate.htmlFor === id,
      );
      return label?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    }

    function accessibleName(element) {
      const aria = element.getAttribute("aria-label")?.trim();
      if (aria) return aria;

      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        const labelledText = textForIds(labelledBy);
        if (labelledText) return labelledText;
      }

      const parentLabel = element.closest("label");
      const parentText = parentLabel?.textContent?.replace(/\s+/g, " ").trim();
      if (parentText) return parentText;

      const explicitLabel = labelFor(element);
      if (explicitLabel) return explicitLabel;

      const text = element.textContent?.replace(/\s+/g, " ").trim();
      if (text) return text;

      return (
        element.getAttribute("title") ||
        element.getAttribute("placeholder") ||
        element.getAttribute("name") ||
        ""
      ).trim();
    }

    function isFocusable(element) {
      if (element.getAttribute("disabled") !== null) return false;
      if (element.getAttribute("aria-disabled") === "true") return false;
      const tag = element.tagName.toLowerCase();
      if (tag === "a") return Boolean(element.getAttribute("href"));
      if (["button", "select", "textarea"].includes(tag)) return true;
      if (tag === "input") {
        const type = (element.getAttribute("type") ?? "text").toLowerCase();
        return !["hidden"].includes(type);
      }
      const tabindex = element.getAttribute("tabindex");
      return tabindex !== null && tabindex !== "-1";
    }

    const visibleMainLandmarks = Array.from(
      document.querySelectorAll("main,[role='main']"),
    ).filter((element) => isVisible(element) && !isFrameworkInjected(element));

    const visibleHeadings = Array.from(
      document.querySelectorAll("h1,h2,h3,h4,h5,h6"),
    )
      .filter((element) => isVisible(element) && !isFrameworkInjected(element))
      .map((element) => ({
        level: Number(element.tagName.slice(1)),
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      }))
      .filter((heading) => heading.text.length > 0);

    const ids = new Map();
    const duplicateIds = [];
    for (const element of document.querySelectorAll("[id]")) {
      if (isFrameworkInjected(element)) continue;
      const id = element.getAttribute("id");
      if (!id) continue;
      if (ids.has(id) && !duplicateIds.includes(id)) duplicateIds.push(id);
      ids.set(id, true);
    }

    const brokenAriaReferences = [];
    for (const element of document.querySelectorAll(
      "[aria-describedby],[aria-labelledby],[aria-controls]",
    )) {
      if (isFrameworkInjected(element)) continue;
      for (const attribute of [
        "aria-describedby",
        "aria-labelledby",
        "aria-controls",
      ]) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        for (const targetId of value.split(/\s+/).filter(Boolean)) {
          if (!document.getElementById(targetId)) {
            brokenAriaReferences.push({
              attribute,
              targetId,
              descriptor: descriptorFor(element),
            });
          }
        }
      }
    }

    const focusableNameIssues = [];
    const hiddenFocusableIssues = [];
    const linkTargetIssues = [];
    for (const element of document.querySelectorAll(
      "a[href],button,input,select,textarea,[tabindex]",
    )) {
      if (isFrameworkInjected(element)) continue;
      if (!isFocusable(element)) continue;

      const descriptor = descriptorFor(element);
      if (element.closest("[aria-hidden='true']")) hiddenFocusableIssues.push(descriptor);
      if (isVisible(element) && !accessibleName(element)) {
        focusableNameIssues.push(descriptor);
      }

      if (element.tagName.toLowerCase() === "a") {
        const href = element.getAttribute("href") ?? "";
        if (!href) {
          linkTargetIssues.push(`${descriptor} has empty href`);
        } else if (/^javascript:/i.test(href)) {
          linkTargetIssues.push(`${descriptor} uses javascript href`);
        } else if (href.startsWith("#") && !document.getElementById(href.slice(1))) {
          linkTargetIssues.push(`${descriptor} points to missing ${href}`);
        }
      }
    }

    return {
      mainLandmarkCount: visibleMainLandmarks.length,
      visibleH1Texts: visibleHeadings
        .filter((heading) => heading.level === 1)
        .map((heading) => heading.text),
      visibleHeadingLevels: visibleHeadings.map((heading) => heading.level),
      duplicateIds,
      brokenAriaReferences,
      focusableNameIssues,
      hiddenFocusableIssues,
      linkTargetIssues,
    };
  });

  return assertRouteSemanticSnapshot(snapshot, scope);
}
