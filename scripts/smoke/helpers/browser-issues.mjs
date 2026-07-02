export function trackBrowserIssues(
  page,
  browserIssues,
  { consumeIssue = () => false, ignoreConsoleError = () => false } = {},
) {
  page.on("pageerror", (error) => {
    const issue = `pageerror: ${error.stack || error.message}`;
    if (!consumeIssue(issue)) browserIssues.push(issue);
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (ignoreConsoleError(text)) return;
    const issue = `console: ${text}`;
    if (!consumeIssue(issue)) browserIssues.push(issue);
  });
  page.on("response", (response) => {
    if (response.status() < 500) return;
    const issue = `http ${response.status()}: ${response.url()}`;
    if (!consumeIssue(issue)) browserIssues.push(issue);
  });
}
