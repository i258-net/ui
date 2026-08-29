import { expect, test } from "@playwright/test";

/**
 * Chromatic `onlyStoryNames` never captures Docs. One autodocs page under
 * Playwright VRT is the gate for regressions like the ui#39 dark-Docs bug
 * (themed embeds on an unthemed Docs chrome).
 *
 * Storybook `docs.defaultName` is "Documentation" → id suffix `--documentation`.
 */
const DOCS_PAGE = {
  id: "primitives-button--documentation",
  name: "button-documentation",
} as const;

const THEMES = ["light", "dark"] as const;

function docsUrl(theme: (typeof THEMES)[number]): string {
  const globals = encodeURIComponent(`theme:${theme}`);
  return `/iframe.html?id=${DOCS_PAGE.id}&viewMode=docs&globals=${globals}`;
}

for (const theme of THEMES) {
  test(`docs ${DOCS_PAGE.name} ${theme}`, async ({ page }) => {
    await page.goto(docsUrl(theme), { waitUntil: "networkidle" });
    // `.sbdocs` alone matches every preview/action chrome; the page wrapper is unique.
    const docs = page.locator(".sbdocs.sbdocs-wrapper");
    await docs.waitFor({ state: "visible", timeout: 15_000 });
    // Docs embeds many stories — each has its own data-theme host. Wait until
    // at least one themed embed matches the toolbar before screenshotting.
    await page
      .locator(`.sbdocs.sbdocs-wrapper [data-theme="${theme}"]`)
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('1em "Geist Sans"'),
        document.fonts.load('1em "Geist Mono"'),
      ]);
      await document.fonts.ready;
    });
    await expect(docs).toHaveScreenshot(`${DOCS_PAGE.name}-${theme}.png`);
  });
}
