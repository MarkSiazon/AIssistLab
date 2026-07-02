export async function installMockClipboard(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__smokeCopiedText = value;
        },
      },
    });
  });
}

export async function readMockClipboardText(page) {
  return page.evaluate(() => window.__smokeCopiedText);
}
