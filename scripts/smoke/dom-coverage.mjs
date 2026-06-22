const unclickedEnabledButtonPatterns = [];

const disabledOrTransientButtonPatterns = [
  /^Type message$/,
  /^Fix fields$/,
  /^No changes$/,
  /^Clear$/,
  /^Open Login$/,
  /^Test CLI$/,
  /^Preview Folder$/,
  /^Save$/,
  /^Rebuild$/,
  /^Select skills to download$/,
  /^Preparing Export$/,
  /^Checking\.\.\.$/,
  /^Refreshing\.\.\.$/,
  /^Rendering \. \. \.$/,
  /^Setup required$/,
];

const alreadyVerifiedOrStateOnlyLinkPatterns = [
  /^Skip to main content$/,
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeButtonText(value) {
  return value.replace(/\s+/g, " ").trim();
}

export async function markButtonLocatorCovered(button) {
  await button
    .evaluate(
      (element) => {
        element.__smokeCovered = true;
      },
      undefined,
      { timeout: 2000 },
    )
    .catch(() => undefined);
}

export async function markLinkLocatorCovered(link) {
  await link
    .evaluate(
      (element) => {
        element.__smokeCovered = true;
      },
      undefined,
      { timeout: 2000 },
    )
    .catch(() => undefined);
}

function normalizeExpectedValues(values) {
  return [...new Set(values.map((value) => normalizeButtonText(String(value))))];
}

export async function markVisibleButtonsCoveredByLabel(locator, labels, options = {}) {
  const expectedLabels = normalizeExpectedValues(labels);
  const seenLabels = await locator.locator("button").evaluateAll((buttons, expected) => {
    const labelsToCover = new Set(expected);
    const seen = new Set();

    for (const button of buttons) {
      const label = (
        button.innerText ||
        button.getAttribute("aria-label") ||
        button.getAttribute("title") ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim();
      const visible = Boolean(
        button.offsetWidth ||
          button.offsetHeight ||
          button.getClientRects().length,
      );
      if (!visible || !labelsToCover.has(label)) continue;

      seen.add(label);
      const disabled =
        button.disabled || button.getAttribute("aria-disabled") === "true";
      if (!disabled) {
        button.__smokeCovered = true;
      }
    }

    return [...seen];
  }, expectedLabels);

  const seen = new Set(seenLabels);
  const missing = expectedLabels.filter((label) => !seen.has(label));
  if (options.requireAll !== false) {
    assert(
      missing.length === 0,
      `Expected visible button label(s) were not found: ${missing.join(" | ")}`,
    );
  }
}

export async function markVisibleLinksCoveredByLabel(locator, labels, options = {}) {
  const expectedLabels = normalizeExpectedValues(labels);
  const seenLabels = await locator.locator("a").evaluateAll((links, expected) => {
    const labelsToCover = new Set(expected);
    const seen = new Set();

    for (const link of links) {
      const label = (
        link.innerText ||
        link.getAttribute("aria-label") ||
        link.getAttribute("title") ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim();
      const visible = Boolean(
        link.offsetWidth || link.offsetHeight || link.getClientRects().length,
      );
      if (visible && labelsToCover.has(label)) {
        seen.add(label);
        link.__smokeCovered = true;
      }
    }

    return [...seen];
  }, expectedLabels);

  const seen = new Set(seenLabels);
  const missing = expectedLabels.filter((label) => !seen.has(label));
  if (options.requireAll !== false) {
    assert(
      missing.length === 0,
      `Expected visible link label(s) were not found: ${missing.join(" | ")}`,
    );
  }
}

export async function markVisibleLinksCoveredByHref(locator, hrefs, options = {}) {
  const expectedHrefs = normalizeExpectedValues(hrefs);
  const seenHrefs = await locator.locator("a").evaluateAll((links, expected) => {
    const hrefsToCover = new Set(expected);
    const seen = new Set();

    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      const visible = Boolean(
        link.offsetWidth || link.offsetHeight || link.getClientRects().length,
      );
      if (visible && hrefsToCover.has(href)) {
        seen.add(href);
        link.__smokeCovered = true;
      }
    }

    return [...seen];
  }, expectedHrefs);

  const seen = new Set(seenHrefs);
  const missing = expectedHrefs.filter((href) => !seen.has(href));
  if (options.requireAll !== false) {
    assert(
      missing.length === 0,
      `Expected visible link href(s) were not found: ${missing.join(" | ")}`,
    );
  }
}

function isButtonCovered(text, disabled = false) {
  const normalized = normalizeButtonText(text);
  if (!normalized) return true;
  const fallbackPatterns = disabled
    ? disabledOrTransientButtonPatterns
    : unclickedEnabledButtonPatterns;
  return fallbackPatterns.some((pattern) => pattern.test(normalized));
}

function isLinkCovered(text) {
  const normalized = normalizeButtonText(text);
  if (!normalized) return true;
  return alreadyVerifiedOrStateOnlyLinkPatterns.some((pattern) =>
    pattern.test(normalized),
  );
}

async function visibleButtonStates(page) {
  return await page.locator("button").evaluateAll((buttons) =>
    buttons
      .filter((button) =>
        Boolean(
          button.offsetWidth ||
            button.offsetHeight ||
            button.getClientRects().length,
        ) && !(
          button.id.startsWith("next-") ||
          Boolean(
            button.closest(
              "[data-nextjs-toast],[data-nextjs-dev-overlay],nextjs-portal",
            ),
          )
        ),
      )
      .map((button) => {
        const label = (
          button.innerText ||
          button.getAttribute("aria-label") ||
          button.getAttribute("title") ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim();
        const className =
          typeof button.className === "string" ? button.className : "";
        return {
          label,
          covered: Boolean(button.__smokeCovered),
          disabled: button.disabled || button.getAttribute("aria-disabled") === "true",
          descriptor: [
            button.tagName.toLowerCase(),
            button.id ? `#${button.id}` : "",
            className
              ? `.${className
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 4)
                  .join(".")}`
              : "",
          ].join(""),
        };
      })
      .filter((button) => Boolean(button.label)),
  );
}

export async function assertVisibleButtonsAccountedFor(page, scope) {
  const buttons = await visibleButtonStates(page);
  const missing = [
    ...new Set(
      buttons
        .filter(
          (button) =>
            !button.covered && !isButtonCovered(button.label, button.disabled),
        )
        .map(
          (button) =>
            `${button.label}${button.disabled ? " (disabled)" : ""} at ${
              button.descriptor
            }`,
        ),
    ),
  ];
  assert(
    missing.length === 0,
    `${scope} has visible buttons not covered or classified: ${missing.join(" | ")}`,
  );
}

export async function assertVisibleLinksAccountedFor(page, scope) {
  const result = await page.locator("a").evaluateAll((links) => {
    function isFrameworkInjected(element) {
      const id = element.getAttribute("id") ?? "";
      return id.startsWith("next-") || Boolean(element.closest("[data-nextjs-toast]"));
    }

    function isVisible(element) {
      return Boolean(
        element.offsetWidth ||
          element.offsetHeight ||
          element.getClientRects().length,
      );
    }

    function labelFor(element) {
      return (
        element.innerText ||
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim();
    }

    function descriptorFor(element) {
      const className =
        typeof element.className === "string" ? element.className : "";
      return [
        element.tagName.toLowerCase(),
        element.id ? `#${element.id}` : "",
        className
          ? `.${className
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 4)
              .join(".")}`
          : "",
      ].join("");
    }

    const visibleLinks = [];
    const targetIssues = [];

    for (const link of links) {
      if (isFrameworkInjected(link)) continue;
      if (!isVisible(link)) continue;

      const label = labelFor(link);
      const href = link.getAttribute("href");
      if (label) {
        visibleLinks.push({
          label,
          href: href ?? "",
          covered: Boolean(link.__smokeCovered),
          descriptor: descriptorFor(link),
        });
      }

      if (!href || href === "#") {
        targetIssues.push(`${label || "Unlabelled link"} has no usable href`);
        continue;
      }
      if (/^javascript:/i.test(href)) {
        targetIssues.push(`${label || href} uses a javascript href`);
        continue;
      }
      if (href.startsWith("#")) {
        const target = document.getElementById(decodeURIComponent(href.slice(1)));
        if (!target) {
          targetIssues.push(`${label || href} points to missing target ${href}`);
        }
      }
    }

    return { visibleLinks, targetIssues };
  });
  const missing = [
    ...new Set(
      result.visibleLinks
        .filter((link) => !link.covered && !isLinkCovered(link.label, link.href))
        .map((link) => `${link.label} -> ${link.href} at ${link.descriptor}`),
    ),
  ];
  assert(
    result.targetIssues.length === 0,
    `${scope} has visible links with invalid targets: ${result.targetIssues.join(
      " | ",
    )}`,
  );
  assert(
    missing.length === 0,
    `${scope} has visible links not covered or classified: ${missing.join(" | ")}`,
  );
}
