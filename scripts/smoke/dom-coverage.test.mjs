import assert from "node:assert/strict";
import {
  assertVisibleButtonsAccountedFor,
  assertVisibleLinksAccountedFor,
  markVisibleButtonsCoveredByLabel,
  markVisibleLinksCoveredByHref,
  markVisibleLinksCoveredByLabel,
} from "./dom-coverage.mjs";

function element(attributes = {}) {
  const values = { ...attributes };
  return {
    __smokeCovered: Boolean(values.__smokeCovered),
    className: values.className ?? "",
    disabled: Boolean(values.disabled),
    id: values.id ?? "",
    innerText: values.innerText ?? "",
    offsetHeight: values.visible === false ? 0 : (values.offsetHeight ?? 44),
    offsetWidth: values.visible === false ? 0 : (values.offsetWidth ?? 120),
    tagName: values.tagName ?? "BUTTON",
    getAttribute(name) {
      return values[name] ?? null;
    },
    getClientRects() {
      return values.visible === false ? [] : [{}];
    },
    closest() {
      return null;
    },
  };
}

function pageWith({ buttons = [], links = [], targetIds = [] } = {}) {
  return {
    locator(selector) {
      const elements = selector === "button" ? buttons : links;
      return {
        async evaluateAll(callback, argument) {
          const previousDocument = globalThis.document;
          globalThis.document = {
            getElementById(id) {
              return targetIds.includes(id) ? { id } : null;
            },
          };
          try {
            return callback(elements, argument);
          } finally {
            globalThis.document = previousDocument;
          }
        },
      };
    },
  };
}

await assert.rejects(
  () =>
    assertVisibleButtonsAccountedFor(
      pageWith({ buttons: [element({ innerText: "Save changes" })] }),
      "enabled button",
    ),
  /Save changes/,
);

await assert.rejects(
  () =>
    assertVisibleButtonsAccountedFor(
      pageWith({ buttons: [element({ innerText: "Open Login" })] }),
      "enabled login button",
    ),
  /Open Login/,
);

await assert.doesNotReject(() =>
  assertVisibleButtonsAccountedFor(
    pageWith({
      buttons: [
        element({ innerText: "Open Login", disabled: true }),
        element({ innerText: "Save changes", __smokeCovered: true }),
      ],
    }),
    "covered or disabled buttons",
  ),
);

await assert.rejects(
  () =>
    assertVisibleLinksAccountedFor(
      pageWith({
        links: [
          element({
            tagName: "A",
            innerText: "Export Diagnostics",
            href: "javascript:void(0)",
          }),
        ],
      }),
      "unsafe link",
    ),
  /javascript href/,
);

await assert.rejects(
  () =>
    assertVisibleLinksAccountedFor(
      pageWith({
        links: [
          element({
            tagName: "A",
            innerText: "Open Export",
            href: "/export",
          }),
        ],
      }),
      "uncovered link",
    ),
  /Open Export/,
);

await assert.doesNotReject(() =>
  assertVisibleLinksAccountedFor(
    pageWith({
      links: [
        element({ tagName: "A", innerText: "Skip to main content", href: "#main" }),
        element({
          tagName: "A",
          innerText: "Open Export",
          href: "/export",
          __smokeCovered: true,
        }),
      ],
      targetIds: ["main"],
    }),
    "covered links",
  ),
);

const markerButtons = [
  element({ innerText: "Save changes" }),
  element({ innerText: "Open Login", disabled: true }),
];
await assert.doesNotReject(() =>
  markVisibleButtonsCoveredByLabel(pageWith({ buttons: markerButtons }), [
    "Save changes",
    "Open Login",
  ]),
);
assert.equal(markerButtons[0].__smokeCovered, true);
assert.equal(markerButtons[1].__smokeCovered, false);
await assert.rejects(
  () =>
    markVisibleButtonsCoveredByLabel(pageWith({ buttons: markerButtons }), [
      "Missing Button",
    ]),
  /Missing Button/,
);
await assert.doesNotReject(() =>
  markVisibleButtonsCoveredByLabel(
    pageWith({ buttons: markerButtons }),
    ["Missing Optional Button"],
    { requireAll: false },
  ),
);

const markerLinks = [
  element({ tagName: "A", innerText: "Open Export", href: "/export" }),
  element({
    tagName: "A",
    innerText: "Export Diagnostics",
    href: "/export?diagnostics=true",
  }),
];
await assert.doesNotReject(() =>
  markVisibleLinksCoveredByLabel(pageWith({ links: markerLinks }), [
    "Open Export",
  ]),
);
assert.equal(markerLinks[0].__smokeCovered, true);
await assert.doesNotReject(() =>
  markVisibleLinksCoveredByHref(pageWith({ links: markerLinks }), [
    "/export?diagnostics=true",
  ]),
);
assert.equal(markerLinks[1].__smokeCovered, true);
await assert.rejects(
  () =>
    markVisibleLinksCoveredByHref(pageWith({ links: markerLinks }), [
      "/missing",
    ]),
  /\/missing/,
);
await assert.doesNotReject(() =>
  markVisibleLinksCoveredByHref(
    pageWith({ links: markerLinks }),
    ["/missing-optional"],
    { requireAll: false },
  ),
);

console.log("DOM coverage helper tests passed");
