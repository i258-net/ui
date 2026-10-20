import { expect, test, type Page } from "@playwright/test";

/**
 * Dialog, Menu and CommandPalette at real viewports — behaviour and
 * geometry, no screenshots (those are in overlays-screens.spec.ts).
 *
 * Story tests run at 1280px with a fine pointer; this covers 320px reflow
 * and a short 200%-zoom viewport, 44px targets on coarse pointers, the
 * 24px floor of the palette's Close under either box-sizing, forced
 * colours and reduced motion.
 */

async function open(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=${encodeURIComponent("theme:light")}`, {
    waitUntil: "networkidle",
  });
}

/** Popups fade and scale in; measure them once that has finished. */
async function settled(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".i258-dialog, .i258-dialog__backdrop, .i258-menu")].every(
      (el) => el.getAnimations().length === 0,
    ),
  );
}

async function openPalette(page: Page) {
  await open(page, "patterns-commandpalette--open");
  await expect(page.getByRole("combobox", { name: "Search commands" })).toBeFocused();
  await settled(page);
}

const box = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  });

test.describe("reflow", () => {
  for (const [width, height, boxSizing] of [
    [320, 640, "content-box"],
    [320, 640, "border-box"],
    [640, 400, "content-box"],
  ] as const) {
    test(`${width}×${height}, ${boxSizing}: palette and dialog fit, nothing scrolls sideways`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      // Unlayered, as a consumer reset would be, so it beats @layer i258-components.
      await page.addInitScript((b) => {
        document.addEventListener("DOMContentLoaded", () => {
          const style = document.createElement("style");
          style.textContent = `*, *::before, *::after { box-sizing: ${b}; }`;
          document.head.append(style);
        });
      }, boxSizing);

      await openPalette(page);
      const palette = await box(page, ".i258-palette");
      expect(palette.left).toBeGreaterThanOrEqual(0);
      expect(palette.right).toBeLessThanOrEqual(width);
      expect(palette.bottom).toBeLessThanOrEqual(height);
      // The list scrolls inside the palette; the search row and footer stay.
      await expect(page.locator(".i258-palette__footer")).toBeInViewport();
      await expect(page.getByRole("combobox")).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // Moving to the last option scrolls it into view.
      await page.keyboard.press("Control+End");
      await expect(page.getByRole("option").last()).toBeInViewport();

      // A short dialog and one taller than the viewport.
      for (const id of ["primitives-dialog--open", "primitives-dialog--long-content"]) {
        await open(page, id);
        await expect(page.getByRole("dialog")).toBeVisible();
        await settled(page);
        const dialog = await box(page, ".i258-dialog");
        expect(dialog.left, id).toBeGreaterThanOrEqual(0);
        expect(dialog.right, id).toBeLessThanOrEqual(width);
        expect(dialog.top, id).toBeGreaterThanOrEqual(0);
        expect(dialog.bottom, id).toBeLessThanOrEqual(height);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      }
      // The long one's footer is reachable on screen.
      await expect(page.getByRole("button", { name: "Done" })).toBeInViewport();
    });
  }
});

test.describe("coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 700 } });

  test("menu items, palette options and close buttons are 44px targets", async ({ page }) => {
    await open(page, "primitives-menu--options-open");
    await expect(page.getByRole("menu")).toBeVisible();
    await settled(page);
    for (const item of await page.locator(".i258-menu__item").all()) {
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }

    await openPalette(page);
    for (const option of await page.getByRole("option").all()) {
      expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect((await page.getByRole("button", { name: "Close" }).boundingBox())!.height).toBeGreaterThanOrEqual(44);

    await open(page, "primitives-dialog--open");
    await settled(page);
    const close = (await page.getByRole("button", { name: "Close" }).boundingBox())!;
    expect(close.width).toBeGreaterThanOrEqual(44);
    expect(close.height).toBeGreaterThanOrEqual(44);
    // The title's text box (inside its reserved end padding) keeps clear of it.
    const titleEnd = await page.getByRole("heading", { name: "Resolve X-19?" }).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.right - parseFloat(getComputedStyle(el).paddingInlineEnd);
    });
    expect(titleEnd).toBeLessThanOrEqual(close.x);
  });
});

test("either box-sizing: same palette and dialog size, Close keeps its 24px floor, same key caps", async ({ page }) => {
  const measure = async (boxSizing: "content-box" | "border-box") => {
    await openPalette(page);
    // Unlayered, as a consumer reset would be, so it beats @layer i258-components.
    await page.addStyleTag({ content: `*, *::before, *::after { box-sizing: ${boxSizing}; }` });
    const palette = await box(page, ".i258-palette");
    const close = (await page.getByRole("button", { name: "Close" }).boundingBox())!;
    const caps = await page
      .locator(".i258-palette__footer .i258-kbd")
      .evaluateAll((els) => els.map((el) => [el.getBoundingClientRect().width, el.getBoundingClientRect().height]));
    await open(page, "primitives-dialog--long-content");
    await settled(page);
    await page.addStyleTag({ content: `*, *::before, *::after { box-sizing: ${boxSizing}; }` });
    const dialog = await box(page, ".i258-dialog");
    return { palette: [palette.width, palette.height], dialog: [dialog.width, dialog.height], closeHeight: close.height, caps };
  };
  const content = await measure("content-box");
  const border = await measure("border-box");
  expect(content.closeHeight).toBeGreaterThanOrEqual(24);
  expect(border.closeHeight).toBeGreaterThanOrEqual(24);
  expect(content.palette).toEqual(border.palette);
  expect(content.dialog).toEqual(border.dialog);
  expect(content.caps).toEqual(border.caps);
});

test.describe("forced colours and reduced motion", () => {
  test("forced colours: the highlighted item and the active option are outlined", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "primitives-menu--open");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.getByRole("menuitem", { name: "Archive" }).hover();
    await expect(page.getByRole("menuitem", { name: "Archive" })).toHaveAttribute("data-highlighted", "");
    expect(
      await page.getByRole("menuitem", { name: "Archive" }).evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("solid");

    await openPalette(page);
    const active = page.locator('[role="option"][aria-selected="true"]');
    expect(await active.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
    // The palette's ring is a box-shadow, which forced colours drop; its
    // edge is redrawn as a CanvasText outline.
    const edge = await page.locator(".i258-palette").evaluate((el) => {
      const probe = document.createElement("div");
      probe.style.cssText = "color: CanvasText";
      document.body.append(probe);
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, color: s.outlineColor, canvasText };
    });
    expect(edge.style).toBe("solid");
    expect(edge.color).toBe(edge.canvasText);
  });

  test("reduced motion: popups and the backdrop don't animate", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "primitives-dialog--open");
    await expect(page.getByRole("dialog")).toBeVisible();
    const dialog = await page.evaluate(() =>
      [".i258-dialog", ".i258-dialog__backdrop"].map(
        (s) => getComputedStyle(document.querySelector(s)!).transitionDuration,
      ),
    );
    expect(dialog).toEqual(["0s", "0s"]);

    await open(page, "primitives-menu--open");
    await expect(page.getByRole("menu")).toBeVisible();
    expect(await page.locator(".i258-menu").evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
  });
});
