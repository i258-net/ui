import { expect, test, type Page } from "@playwright/test";

/**
 * Dialog, Menu and CommandPalette screenshots, open, light and dark.
 * Behaviour and geometry are in overlays.spec.ts. Baselines come from
 * Linux (CI's actuals, or the same Playwright image), never a Mac.
 */

const THEMES = ["light", "dark"] as const;

const SCREENS = [
  { id: "primitives-dialog--open", name: "dialog-open", popup: "dialog" },
  { id: "primitives-menu--open", name: "menu-open", popup: "menu" },
  { id: "primitives-menu--options-open", name: "menu-options-open", popup: "menu" },
  { id: "patterns-commandpalette--open", name: "palette-open", popup: "dialog" },
] as const;

async function open(page: Page, id: string, theme: (typeof THEMES)[number]) {
  const globals = encodeURIComponent(`theme:${theme}`);
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=${globals}`, { waitUntil: "networkidle" });
  await page.locator(`#storybook-root [data-theme="${theme}"]`).waitFor();
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('1em "Geist Sans"'),
      document.fonts.load('1em "Geist Mono"'),
    ]);
    await document.fonts.ready;
  });
}

for (const theme of THEMES) {
  test.describe(`overlays ${theme}`, () => {
    test.use({ viewport: { width: 800, height: 600 } });

    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        await open(page, screen.id, theme);
        const popup = page.getByRole(screen.popup);
        await expect(popup).toBeVisible();
        // Wait for the fade/scale in, and for focus to land where it lands
        // every run (the first control, or the palette's field).
        await page.waitForFunction(() =>
          [...document.querySelectorAll(".i258-dialog, .i258-dialog__backdrop, .i258-menu")].every(
            (el) => el.getAnimations().length === 0 && el.matches(":not([data-starting-style])"),
          ),
        );
        if (screen.popup === "dialog") {
          await expect.poll(() => popup.evaluate((el) => el.contains(document.activeElement))).toBe(true);
        }
        await expect(page).toHaveScreenshot(`${screen.name}-${theme}.png`);
      });
    }
  });
}

for (const theme of THEMES) {
  test(`kbd bindings ${theme}`, async ({ page }) => {
    await open(page, "primitives-kbd--bindings", theme);
    await expect(page.locator(`#storybook-root [data-theme="${theme}"]`)).toHaveScreenshot(
      `kbd-bindings-${theme}.png`,
    );
  });
}
