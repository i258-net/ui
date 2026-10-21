import { expect, test, type Page } from "@playwright/test";

/**
 * Tooltip with a real pointer, keyboard and touch — behaviour, no
 * screenshots (overlays-screens.spec.ts has those). Story tests drive
 * synthetic events; this proves WCAG 1.4.13 with Chromium's own mouse:
 * the pointer can travel from the trigger onto the tip (hoverable), the tip
 * stays without a timeout (persistent), and Escape closes it with the
 * pointer still on it and focus unmoved (dismissible). A tap never opens
 * one, and the tip keeps a CanvasText edge in forced colours.
 */

async function open(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=${encodeURIComponent("theme:light")}`, {
    waitUntil: "networkidle",
  });
}

const tip = (page: Page) => page.locator("[data-slot='tooltip']");

test("hoverable, persistent and dismissible with a real pointer", async ({ page }) => {
  await open(page, "primitives-tooltip--static");
  const trigger = page.getByRole("button", { name: "Archive" });
  await trigger.hover();
  await expect(tip(page)).toBeVisible();
  await expect(tip(page)).toHaveAttribute("aria-hidden", "true");

  // Travel from the trigger's centre onto the tip in small steps.
  const t = (await trigger.boundingBox())!;
  const p = (await tip(page).boundingBox())!;
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2, { steps: 12 });
  await page.waitForTimeout(500);
  await expect(tip(page)).toBeVisible();

  // No timeout.
  await page.waitForTimeout(2500);
  await expect(tip(page)).toBeVisible();

  // Escape with the pointer still on the tip; nothing else moves.
  const focusedBefore = await page.evaluate(() => document.activeElement?.tagName);
  await page.keyboard.press("Escape");
  await expect(tip(page)).toBeHidden();
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(focusedBefore);

  // Leaving closes it.
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
  await expect(tip(page)).toBeVisible();
  await page.mouse.move(5, 5);
  await expect(tip(page)).toBeHidden();
});

test("hover on a dialog's control, Escape: the tip closes, the dialog stays", async ({ page }) => {
  await open(page, "primitives-tooltip--in-dialog");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Archive" }).hover();
  await expect(tip(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tip(page)).toBeHidden();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test.describe("touch", () => {
  test.use({ hasTouch: true, isMobile: true });

  test("a tap never opens the tip", async ({ page }) => {
    await open(page, "primitives-tooltip--static");
    await page.getByRole("button", { name: "Archive" }).tap();
    await page.waitForTimeout(700);
    await expect(tip(page)).toHaveCount(0);
  });
});

test("forced colours: the tip keeps a CanvasText edge; reduced motion: no fade", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await open(page, "primitives-tooltip--static");
  await page.getByRole("button", { name: "Archive" }).hover();
  await expect(tip(page)).toBeVisible();
  const s = await tip(page).evaluate((el) => {
    const probe = document.createElement("div");
    probe.style.cssText = "color: CanvasText";
    document.body.append(probe);
    const canvasText = getComputedStyle(probe).color;
    probe.remove();
    const cs = getComputedStyle(el);
    return { border: cs.borderTopColor, style: cs.borderTopStyle, canvasText, duration: cs.transitionDuration };
  });
  expect(s.style).toBe("solid");
  expect(s.border).toBe(s.canvasText);
  expect(s.duration).toBe("0s");
});
