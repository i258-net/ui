import { expect, test, type Page } from "@playwright/test";

/**
 * AppFrame at real viewports — behaviour and geometry, no screenshots.
 *
 * Story tests (app-frame.stories.tsx) run at 1280px; this covers what needs
 * the viewport itself: the shared sheet breakpoints (sidebar < 768px,
 * inspector < 980px), 320px / 200%-zoom reflow, focus never landing under
 * the sticky header, resize strips that no other target overlaps (24px
 * fine, 44px coarse, under either box-sizing), forced colours and reduced
 * motion.
 */

type Theme = "light" | "dark";

function storyUrl(id: string, theme: Theme = "light") {
  return `/iframe.html?id=patterns-appframe--${id}&viewMode=story&globals=${encodeURIComponent(
    `theme:${theme}`,
  )}`;
}

async function open(page: Page, id: string, theme: Theme = "light") {
  await page.goto(storyUrl(id, theme), { waitUntil: "networkidle" });
  await page.locator("#storybook-root .i258-frame").waitFor();
}

async function useBoxSizing(page: Page, boxSizing: "content-box" | "border-box") {
  // Unlayered, as a consumer reset would be, so it beats @layer i258-components.
  await page.addStyleTag({
    content: `*, *::before, *::after { box-sizing: ${boxSizing}; }`,
  });
}

/** Sheets slide in; measure them once their transitions have finished. */
async function settled(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".i258-frame__sheet, .i258-frame__backdrop")].every(
      (el) => el.getAnimations().length === 0,
    ),
  );
}

const activeIsBody = (page: Page) =>
  page.evaluate(() => document.activeElement === document.body || document.activeElement === null);

test.describe("sheet breakpoints", () => {
  for (const [width, navSheet, inspectorSheet] of [
    [767, true, true],
    [768, false, true],
    [979, false, true],
    [980, false, false],
  ] as const) {
    test(`${width}px: nav ${navSheet ? "sheet" : "inline"}, inspector ${inspectorSheet ? "sheet" : "inline"}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await open(page, "default");
      const frame = page.locator(".i258-frame");
      await expect(frame).toHaveAttribute("data-sidebar", navSheet ? "sheet" : "expanded");
      await expect(page.getByRole("button", { name: navSheet ? "Open navigation" : "Collapse sidebar" })).toBeVisible();

      await page.getByRole("button", { name: "Open Example record 2" }).click();
      if (inspectorSheet) {
        await expect(page.getByRole("dialog", { name: "Item details" })).toBeVisible();
        await expect(frame.locator(".i258-frame__inspector")).toHaveCount(0);
      } else {
        await expect(page.getByRole("complementary", { name: "Item details" })).toBeVisible();
        await expect(page.getByRole("dialog")).toHaveCount(0);
      }
    });
  }
});

test.describe("navigation sheet", () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test("traps focus, makes the page inert, closes on Escape and returns focus", async ({ page }) => {
    await open(page, "default");
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toHaveCount(0);
    const opener = page.getByRole("button", { name: "Open navigation" });
    await opener.focus();
    await page.keyboard.press("Enter");

    const sheet = page.getByRole("dialog", { name: "Navigation" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(sheet.getByRole("link", { name: /Inbox/ })).toHaveAttribute("aria-current", "page");
    // Focus is inside and stays inside.
    await expect(sheet.getByRole("button", { name: "Close navigation" })).toBeFocused();
    // Base UI's focus guards hold focus for a moment while wrapping.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      await expect.poll(() => sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Shift+Tab");
      await expect.poll(() => sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    // The rest of the frame is out of reach.
    await expect(page.getByRole("main")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test("close button and backdrop close it", async ({ page }) => {
    await open(page, "default");
    const opener = page.getByRole("button", { name: "Open navigation" });
    await opener.click();
    await page.getByRole("button", { name: "Close navigation" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(opener).toBeFocused();

    await opener.click();
    await settled(page);
    await page.mouse.click(380, 350);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("widening past 768px with the sheet open keeps focus off <body>", async ({ page }) => {
    await open(page, "default");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("dialog", { name: "Navigation" }).getByRole("link", { name: /Projects/ }).focus();
    await page.setViewportSize({ width: 1024, height: 700 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeVisible();
    await expect.poll(() => activeIsBody(page)).toBe(false);
    // Narrowing again does not reopen it: the frame reported the close.
    await page.setViewportSize({ width: 390, height: 700 });
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("inherits the frame's theme and density", async ({ page }) => {
    await open(page, "compact-dark-rail", "dark");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const sheet = page.getByRole("dialog", { name: "Navigation" });
    await expect(sheet).toBeVisible();
    const inherited = await sheet.evaluate((el) => ({
      density: el.closest("[data-density]")?.getAttribute("data-density"),
      theme: el.closest("[data-theme]")?.getAttribute("data-theme"),
      controlMd: getComputedStyle(el).getPropertyValue("--i258-control-md").trim(),
      collapsed: el.querySelector(".i258-sidebar")?.hasAttribute("data-collapsed"),
    }));
    // Rail is a wide-screen mode: the sheet always shows the full sidebar.
    expect(inherited).toEqual({ density: "compact", theme: "dark", controlMd: "1.75rem", collapsed: false });
  });
});

test.describe("inspector sheet", () => {
  test.use({ viewport: { width: 900, height: 700 } });

  test("Escape closes it and returns focus to the opener; close button too", async ({ page }) => {
    await open(page, "default");
    const opener = page.getByRole("button", { name: "Open Example record 4" });
    await opener.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Item details" });
    await expect(sheet.getByRole("heading", { level: 2 })).toHaveText("Example record 4");
    expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(opener).toBeFocused();

    await opener.click();
    await sheet.getByRole("button", { name: "Close inspector" }).click();
    await expect(sheet).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});

test.describe("reflow", () => {
  for (const [viewport, wraps] of [
    [{ width: 320, height: 568 }, true],
    // 1280px at 200% zoom: the header still fits on one line.
    [{ width: 640, height: 400 }, false],
  ] as const) {
    test(`${viewport.width}×${viewport.height}: no horizontal scroll, header ${wraps ? "wraps and " : ""}is cleared`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await open(page, "long-content");
      const m = await page.evaluate(() => {
        const pane = document.querySelector<HTMLElement>(".i258-frame__main")!;
        const header = document.querySelector<HTMLElement>(".i258-frame-header")!;
        return {
          docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          paneOverflow: pane.scrollWidth - pane.clientWidth,
          headerH: header.getBoundingClientRect().height,
          headerMin: parseFloat(getComputedStyle(header).minHeight),
          padding: parseFloat(getComputedStyle(pane).scrollPaddingTop),
        };
      });
      expect(m.docOverflow).toBeLessThanOrEqual(0);
      expect(m.paneOverflow).toBeLessThanOrEqual(0);
      if (wraps) expect(m.headerH).toBeGreaterThan(m.headerMin);
      else expect(m.headerH).toBe(m.headerMin);
      // Nothing in the header spills below it.
      expect(
        await page.evaluate(() => {
          const h = document.querySelector(".i258-frame-header")!;
          const bottom = h.getBoundingClientRect().bottom;
          return [...h.querySelectorAll("button, a, h1")].every(
            (el) => el.getBoundingClientRect().bottom <= bottom,
          );
        }),
      ).toBe(true);
      expect(m.padding).toBe(Math.ceil(m.headerH) + 20);
    });
  }
});

test.describe("focus is never obscured by the sticky header", () => {
  for (const viewport of [
    { width: 1280, height: 660 },
    { width: 640, height: 400 },
    { width: 320, height: 568 },
  ]) {
    test(`${viewport.width}×${viewport.height}: Tab and Shift+Tab through 40 stops`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await open(page, "long-content");
      const check = () =>
        page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const pane = document.querySelector<HTMLElement>(".i258-frame__main")!;
          if (!pane.contains(el) || el.closest(".i258-frame-header")) return null;
          const header = pane.querySelector(".i258-frame-header")!.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          const p = pane.getBoundingClientRect();
          return {
            stop: el.dataset["stop"] ?? el.textContent,
            clearOfHeader: r.top >= header.bottom - 0.5,
            insidePane: r.bottom <= p.bottom + 0.5,
          };
        });

      await page.locator('[data-stop="1"]').focus();
      for (let i = 0; i < 39; i++) {
        await page.keyboard.press("Tab");
        const c = await check();
        if (c) expect(c, `forward ${c.stop}`).toMatchObject({ clearOfHeader: true, insidePane: true });
      }
      await expect(page.locator('[data-stop="40"]')).toBeFocused();
      for (let i = 0; i < 39 + 8; i++) {
        await page.keyboard.press("Shift+Tab");
        const c = await check();
        if (c) expect(c, `back ${c.stop}`).toMatchObject({ clearOfHeader: true, insidePane: true });
      }
    });
  }
});

/** Rects of every focusable target other than the handles, inside the frame. */
async function overlaps(page: Page) {
  return page.evaluate(() => {
    const handles = [...document.querySelectorAll<HTMLElement>(".i258-resize-handle")];
    const others = [
      ...document.querySelectorAll<HTMLElement>(
        ".i258-frame a[href], .i258-frame button, .i258-frame [tabindex='0']:not(.i258-resize-handle)",
      ),
    ].filter((el) => el.getClientRects().length > 0 && !el.classList.contains("i258-skip-link"));
    const out: string[] = [];
    for (const h of handles) {
      const a = h.getBoundingClientRect();
      for (const o of others) {
        const b = o.getBoundingClientRect();
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 0.5 && iy > 0.5) out.push(`${h.getAttribute("aria-label")} × ${o.textContent || o.getAttribute("aria-label")}`);
      }
    }
    return {
      out,
      widths: handles.map((h) => h.getBoundingClientRect().width),
      // What a pointer hits across the middle of each strip.
      hits: handles.map((h) => {
        const r = h.getBoundingClientRect();
        const y = r.top + r.height / 2;
        return [0.5, r.width / 2, r.width - 0.5].every(
          (dx) => document.elementFromPoint(r.left + dx, y) === h,
        );
      }),
    };
  });
}

for (const boxSizing of ["content-box", "border-box"] as const) {
  test.describe(`targets, ${boxSizing}`, () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("fine pointer: 24px resize strips, nothing under them", async ({ page }) => {
      await open(page, "default");
      await useBoxSizing(page, boxSizing);
      await page.getByRole("button", { name: "Open Example record 1" }).click();
      const r = await overlaps(page);
      expect(r.widths).toEqual([24, 24]);
      expect(r.hits).toEqual([true, true]);
      expect(r.out).toEqual([]);
      const close = await page.getByRole("button", { name: "Close inspector" }).boundingBox();
      expect(close!.width).toBeGreaterThanOrEqual(24);
      expect(close!.height).toBeGreaterThanOrEqual(24);
    });

    test("fine pointer, compact: strips still clear", async ({ page }) => {
      await open(page, "compact-dark-rail", "dark");
      await useBoxSizing(page, boxSizing);
      await page.getByRole("button", { name: "Expand sidebar" }).click();
      await page.getByRole("button", { name: "Open Example record 1" }).click();
      const r = await overlaps(page);
      expect(r.widths).toEqual([24, 24]);
      expect(r.out).toEqual([]);
    });

    test.describe("coarse pointer", () => {
      test.use({ hasTouch: true, isMobile: true, viewport: { width: 1280, height: 800 } });

      test("44px strips, 44px rows and rail items, nothing under the strips", async ({ page }) => {
        await open(page, "default");
        await useBoxSizing(page, boxSizing);
        expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
        await page.getByRole("button", { name: "Open Example record 1" }).click();
        const r = await overlaps(page);
        expect(r.widths).toEqual([44, 44]);
        expect(r.hits).toEqual([true, true]);
        expect(r.out).toEqual([]);
        for (const name of [/Inbox/, /Settings/]) {
          const box = await page.getByRole("link", { name }).boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
        const close = await page.getByRole("button", { name: "Close inspector" }).boundingBox();
        expect(close!.width).toBeGreaterThanOrEqual(44);
        expect(close!.height).toBeGreaterThanOrEqual(44);

        await page.getByRole("button", { name: "Collapse sidebar" }).click();
        for (const name of [/Inbox/, /Settings/]) {
          const box = await page.getByRole("link", { name }).boundingBox();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      });

      test("sheet close button is 44px and clear of the sidebar header", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 700 });
        await open(page, "default");
        await useBoxSizing(page, boxSizing);
        await page.getByRole("button", { name: "Open navigation" }).click();
        await settled(page);
        const close = await page.getByRole("button", { name: "Close navigation" }).boundingBox();
        expect(close!.width).toBeGreaterThanOrEqual(44);
        expect(close!.height).toBeGreaterThanOrEqual(44);
        const title = await page.getByRole("dialog").getByText("Example app").boundingBox();
        expect(title!.x + title!.width).toBeLessThanOrEqual(close!.x);
      });
    });
  });
}

test.describe("rail names", () => {
  test("a focused rail item shows its name without a second accessible description", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, "compact-dark-rail", "dark");
    const item = page.getByRole("link", { name: /Projects/ });
    await item.focus();
    await expect(page.locator(".i258-sidebar__tip")).toHaveText("Projects");
    await expect(item).toHaveAccessibleName("Projects");
    await expect(item).not.toHaveAttribute("aria-describedby", /.+/);
  });
});

test.describe("forced colours and reduced motion", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("forced colours: current item and focused handle use system colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "default");
    await page.getByRole("separator", { name: "Resize sidebar" }).focus();
    await page.keyboard.press("ArrowRight");
    const s = await page.evaluate(() => {
      const current = document.querySelector<HTMLElement>(".i258-sidebar__item[data-current]")!;
      const handle = document.querySelector<HTMLElement>(".i258-resize-handle")!;
      return {
        currentOutline: getComputedStyle(current).outlineStyle,
        handleOutline: getComputedStyle(handle).outlineStyle,
      };
    });
    expect(s.currentOutline).toBe("solid");
    expect(s.handleOutline).toBe("solid");
    // The edge line fades in (120ms); poll for the settled colour.
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.querySelector(".i258-resize-handle")!, "::after").backgroundColor,
        ),
      )
      .toBe(
        await page.evaluate(() => {
          const probe = document.createElement("div");
          probe.style.cssText = "background: Highlight; forced-color-adjust: none";
          document.body.append(probe);
          const c = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return c;
        }),
      );
  });

  test("reduced motion: no frame transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 700 });
    await open(page, "default");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const d = await page.evaluate(() => {
      const dur = (el: Element | null, pseudo?: string) =>
        el ? getComputedStyle(el, pseudo).transitionDuration : "missing";
      return [
        dur(document.querySelector(".i258-frame__sheet")),
        dur(document.querySelector(".i258-frame__backdrop")),
        dur(document.querySelector(".i258-frame-header"), "::after"),
        dur(document.querySelector(".i258-sidebar__chevron")),
      ];
    });
    expect(d).toEqual(["0s", "0s", "0s", "0s"]);
  });
});
