import { expect, test } from "@playwright/test";

/**
 * Storybook iframe URLs for representative primitive stories.
 * IDs follow Storybook's slug: Title path → kebab, export name → kebab.
 */
const STORIES = [
  { id: "primitives-button--primary", name: "button-primary" },
  { id: "primitives-button--sizes", name: "button-sizes" },
  { id: "primitives-input--default", name: "input-default" },
  { id: "primitives-badge--status", name: "badge-status" },
  { id: "primitives-checkbox--with-label", name: "checkbox-with-label" },
  { id: "primitives-togglechip--row", name: "toggle-chip-row" },
  { id: "primitives-alert--tones", name: "alert-tones" },
  { id: "primitives-surface--composition", name: "surface-composition" },
  { id: "primitives-choice--single-select-chip", name: "choice-single" },
] as const;

const THEMES = ["light", "dark"] as const;

function storyUrl(id: string, theme: (typeof THEMES)[number]): string {
  const globals = encodeURIComponent(`theme:${theme}`);
  return `/iframe.html?id=${id}&viewMode=story&globals=${globals}`;
}

for (const theme of THEMES) {
  test.describe(`primitives ${theme}`, () => {
    for (const story of STORIES) {
      test(`${story.name}`, async ({ page }) => {
        await page.goto(storyUrl(story.id, theme), { waitUntil: "networkidle" });
        const root = page.locator(`[data-theme="${theme}"]`);
        await root.waitFor({ state: "visible", timeout: 15_000 });
        await expect(root).toHaveScreenshot(`${story.name}-${theme}.png`);
      });
    }
  });
}
