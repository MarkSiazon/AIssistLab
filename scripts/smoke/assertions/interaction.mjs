function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function routeInteractionIssues(snapshot, scope) {
  const issues = [];

  for (const control of snapshot.controls) {
    if (!control.accessibleName) {
      issues.push(`${scope} ${control.descriptor} is missing an accessible name`);
    }

    if (!control.enforceTargetSize) continue;

    if (control.height < 44) {
      issues.push(
        `${scope} ${control.descriptor} has small target height ${Math.round(
          control.height,
        )}px`,
      );
    }

    if ((control.tag === "button" || control.tag === "a") && control.width < 44) {
      issues.push(
        `${scope} ${control.descriptor} has small target width ${Math.round(
          control.width,
        )}px`,
      );
    }
  }

  return issues;
}

export function assertRouteInteractionSnapshot(snapshot, scope) {
  const issues = routeInteractionIssues(snapshot, scope);
  assert(
    issues.length === 0,
    `Route interaction issues:\n${issues.join("\n")}`,
  );
  return snapshot;
}

export async function assertRouteInteractionState(target, scope) {
  const snapshot = await target
    .locator("button,a,input,select,textarea")
    .evaluateAll((controls) => {
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

      function joinedText(element) {
        return (element.textContent ?? "").replace(/\s+/g, " ").trim();
      }

      function labelFor(element) {
        const labelledBy = element.getAttribute("aria-labelledby");
        if (labelledBy) {
          const labels = labelledBy
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent ?? "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          if (labels) return labels;
        }

        const id = element.getAttribute("id");
        if (id) {
          const label = Array.from(document.querySelectorAll("label")).find(
            (candidate) => candidate.htmlFor === id,
          );
          const text = label?.textContent?.replace(/\s+/g, " ").trim();
          if (text) return text;
        }

        const parentLabel = element.closest("label");
        const parentText = parentLabel?.textContent?.replace(/\s+/g, " ").trim();
        return parentText ?? "";
      }

      function accessibleName(element) {
        const aria = element.getAttribute("aria-label")?.trim();
        if (aria) return aria;

        const title = element.getAttribute("title")?.trim();
        if (title) return title;

        const tag = element.tagName.toLowerCase();
        if (tag === "button" || tag === "a") {
          const text = joinedText(element);
          if (text) return text;
        }

        const label = labelFor(element);
        if (label) return label;

        const placeholder = element.getAttribute("placeholder")?.trim();
        if (placeholder) return placeholder;

        return element.getAttribute("name")?.trim() ?? "";
      }

      function descriptor(element) {
        const tag = element.tagName.toLowerCase();
        const id = element.getAttribute("id");
        const type = element.getAttribute("type");
        const text = joinedText(element);
        return `${tag}${type ? `[type=${type}]` : ""}${id ? `#${id}` : ""}${
          text ? ` "${text.slice(0, 80)}"` : ""
        }`;
      }

      function shouldEnforceTarget(element) {
        const tag = element.tagName.toLowerCase();
        if (tag === "button" || tag === "select" || tag === "textarea") return true;
        if (tag === "input") {
          const type = (element.getAttribute("type") ?? "text").toLowerCase();
          return !["checkbox", "radio", "file", "hidden"].includes(type);
        }
        if (tag === "a") {
          return (
            element.getAttribute("role") === "button" ||
            element.classList.contains("ui-button") ||
            element.classList.contains("app-nav-link") ||
            element.classList.contains("export-readiness-section-action")
          );
        }
        return false;
      }

      const visibleControls = [];
      for (const element of controls) {
        if (isFrameworkInjected(element)) continue;
        if (!isVisible(element)) continue;

        const rect = element.getBoundingClientRect();
        visibleControls.push({
          accessibleName: accessibleName(element),
          descriptor: descriptor(element),
          enforceTargetSize: shouldEnforceTarget(element),
          height: rect.height,
          tag: element.tagName.toLowerCase(),
          width: rect.width,
        });
      }

      return { controls: visibleControls };
    });

  return assertRouteInteractionSnapshot(snapshot, scope);
}
