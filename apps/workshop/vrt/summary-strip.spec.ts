import { expect, test } from "@playwright/test";

/**
 * Forced colours drop the fill and inset edge that draw a pressed tile, so
 * it is redrawn as a Highlight outline. That outline must not swallow the
 * focus ring: focused, the outline moves outside the tile's edge.
 */
test("forced colours: a pressed tile still shows keyboard focus", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(`/iframe.html?id=patterns-summarystrip--pressed&viewMode=story&globals=${encodeURIComponent("theme:light")}`, {
    waitUntil: "networkidle",
  });
  const pressed = page.getByRole("button", { name: /^9 Decisions/ });
  await expect(pressed).toHaveAttribute("aria-pressed", "true");
  const outline = () =>
    pressed.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, offset: parseFloat(s.outlineOffset) };
    });
  const resting = await outline();
  expect(resting.style).toBe("solid");
  expect(resting.offset).toBeLessThan(0);

  await page.keyboard.press("Tab");
  await expect(pressed).toBeFocused();
  const focused = await outline();
  expect(focused.style).toBe("solid");
  expect(focused.offset).toBeGreaterThan(0);
});
