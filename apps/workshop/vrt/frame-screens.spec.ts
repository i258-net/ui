import { expect, test, type Page } from "@playwright/test";

/**
 * AppFrame screenshots: the wide frame with the inspector open, and the
 * narrow nav sheet, light and dark. Behaviour and geometry are in
 * frame.spec.ts and frame-panes.spec.ts; these catch what those cannot —
 * the frame's look. Baselines come from CI's Linux actuals, never a Mac.
 */

const THEMES = ["light", "dark"] as const;

async function open(page: Page, id: string, theme: (typeof THEMES)[number]) {
  const globals = encodeURIComponent(`theme:${theme}`);
  await page.goto(`/iframe.html?id=patterns-appframe--${id}&viewMode=story&globals=${globals}`, {
    waitUntil: "networkidle",
  });
  await page.locator(`#storybook-root [data-theme="${theme}"] .i258-frame`).waitFor();
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('1em "Geist Sans"'),
      document.fonts.load('1em "Geist Mono"'),
    ]);
    await document.fonts.ready;
  });
}

/** Sheets slide in; wait until nothing in the frame is animating. */
async function settled(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".i258-frame__sheet, .i258-frame__backdrop")].every(
      (el) => el.getAnimations().length === 0,
    ),
  );
}

for (const theme of THEMES) {
  test.describe(`frame ${theme}`, () => {
    test.describe("1280×800", () => {
      test.use({ viewport: { width: 1280, height: 800 } });

      test("inspector open", async ({ page }) => {
        await open(page, "inspector-open", theme);
        await expect(page.getByRole("complementary", { name: "Item details" })).toBeVisible();
        await expect(page.getByRole("separator", { name: "Resize inspector" })).toHaveAttribute(
          "aria-valuenow",
          "400",
        );
        await expect(page).toHaveScreenshot(`frame-inspector-${theme}.png`);
      });
    });

    test.describe("390×700", () => {
      test.use({ viewport: { width: 390, height: 700 } });

      test("nav sheet", async ({ page }) => {
        await open(page, "nav-sheet-open", theme);
        const nav = page.getByRole("dialog", { name: "Navigation" });
        await expect(nav).toBeVisible();
        await settled(page);
        // Focus lands inside the sheet; wait for it so the ring is there
        // (or not) the same way every run.
        await expect.poll(() => nav.evaluate((el) => el.contains(document.activeElement))).toBe(true);
        await expect(page).toHaveScreenshot(`frame-nav-sheet-${theme}.png`);
      });
    });
  });
}
