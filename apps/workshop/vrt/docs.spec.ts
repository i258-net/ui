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

/** Mirrored onto `:root` by ThemeHost; backgrounds addon paints `.docs-story`. */
const THEME_TOKEN: Record<(typeof THEMES)[number], string> = {
  light: "#f7f7f5",
  dark: "#0a0a0a",
};

/** Settled opaque canvas colour (not `rgba(..., α)` mid-transition). */
const DOCS_STORY_BG: Record<(typeof THEMES)[number], string> = {
  light: "rgb(247, 247, 245)",
  dark: "rgb(10, 10, 10)",
};

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

    // Docs embeds many stories. ThemeHost `[data-theme]` is button-sized and
    // paints immediately; the visible canvas is `.docs-story`, filled by the
    // backgrounds addon from `:root` tokens ThemeHost mirrors. Sibling host
    // cleanups used to wipe those tokens (ui#42: Mac white canvases vs Linux
    // dark, ratio 0.27). Wait until every preview has a themed host, `:root`
    // holds the theme token, and each `.docs-story` is the opaque token colour
    // (not a transitional `rgba`).
    const expectedToken = THEME_TOKEN[theme];
    const expectedBg = DOCS_STORY_BG[theme];
    await page.waitForFunction(
      ({ theme: t, expectedToken: token, expectedBg: bg }) => {
        const root = document.querySelector(".sbdocs.sbdocs-wrapper");
        if (!root) return false;
        const previews = root.querySelectorAll(".sbdocs-preview");
        const hosts = root.querySelectorAll(`[data-theme="${t}"]`);
        const stories = [...root.querySelectorAll<HTMLElement>(".docs-story")];
        if (previews.length === 0) return false;
        if (hosts.length !== previews.length) return false;
        if (stories.length !== previews.length) return false;
        const rootToken = getComputedStyle(document.documentElement)
          .getPropertyValue("--i258-background")
          .trim();
        if (rootToken !== token) return false;
        return stories.every(
          (el) => getComputedStyle(el).backgroundColor === bg,
        );
      },
      { theme, expectedToken, expectedBg },
      { timeout: 15_000 },
    );

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
