import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * AppFrame: sheet ownership, hydration, pane widths that fit the frame,
 * the resting resize grip and coarse breadcrumb targets. Behaviour and
 * geometry at real viewports, no screenshots (see frame.spec.ts for the
 * rest of the frame).
 */

type Theme = "light" | "dark";

async function open(page: Page, id: string, theme: Theme = "light") {
  const globals = encodeURIComponent(`theme:${theme}`);
  await page.goto(`/iframe.html?id=patterns-appframe--${id}&viewMode=story&globals=${globals}`, {
    waitUntil: "networkidle",
  });
  await page.locator("#storybook-root .i258-frame").waitFor();
}

/** Every open/width callback the demo app received from the frame. */
const calls = (page: Page) => page.evaluate(() => [...(window.__frameDemo?.calls ?? [])]);

const focusIn = (loc: Locator) => loc.evaluate((el) => el.contains(document.activeElement));

const activeIsBody = (page: Page) =>
  page.evaluate(() => document.activeElement === document.body || document.activeElement === null);

/** Sheets slide in and out; wait until nothing in the frame is animating. */
async function settled(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".i258-frame__sheet, .i258-frame__backdrop")].every(
      (el) => el.getAnimations().length === 0,
    ),
  );
}

/** Dialogs a screen reader can reach: not aria-hidden, not inert. */
const exposedDialogs = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[role='dialog']")]
      .filter((el) => !el.closest("[aria-hidden='true'], [inert]"))
      .map((el) => el.getAttribute("aria-label") ?? el.querySelector("h2, [id]")?.textContent ?? ""),
  );

test.describe("one sheet at a time (390px)", () => {
  test.use({ viewport: { width: 390, height: 700 } });

  test("both requested on the first render: the inspector owns the screen, nav is told it closed", async ({ page }) => {
    await open(page, "both-sheets-requested");
    const inspector = page.getByRole("dialog", { name: "Item details" });
    await expect(inspector).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Navigation" })).toHaveCount(0);
    await settled(page);
    expect(await exposedDialogs(page)).toEqual(["Item details"]);
    await expect.poll(() => focusIn(inspector)).toBe(true);
    expect(await calls(page)).toEqual(["nav:false"]);
    await expect(page.locator(".i258-frame")).not.toHaveAttribute("data-demo-nav-open");

    // Escape closes the inspector it is in, and focus lands in the page.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await settled(page);
    expect(await calls(page)).toEqual(["nav:false", "inspector:false"]);
    expect(await activeIsBody(page)).toBe(false);
    // Nav does not come back: the app accepted the close.
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  });

  test("nav open, then a record opens from it: the inspector replaces the nav sheet", async ({ page }) => {
    await open(page, "sheet-harness");
    const opener = page.getByRole("button", { name: "Open navigation" });
    await opener.click();
    const nav = page.getByRole("dialog", { name: "Navigation" });
    await nav.getByRole("button", { name: "Open latest record" }).click();

    const inspector = page.getByRole("dialog", { name: "Item details" });
    await expect(inspector.getByRole("heading", { level: 2 })).toHaveText("Example record 5");
    await expect(nav).toHaveCount(0);
    await settled(page);
    expect(await exposedDialogs(page)).toEqual(["Item details"]);
    expect(await calls(page)).toEqual(["nav:false"]);
    // Focus is inside the inspector — the closing nav sheet did not pull it
    // back to its opener — and stays inside.
    await expect.poll(() => focusIn(inspector)).toBe(true);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect.poll(() => focusIn(inspector)).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await calls(page)).toEqual(["nav:false", "inspector:false"]);
    // Back to what had focus before the sheets.
    await expect(opener).toBeFocused();
  });

  test("inspector open, then the app opens nav: nav replaces the inspector", async ({ page }) => {
    await open(page, "sheet-harness");
    const opener = page.getByRole("button", { name: "Open Example record 2" });
    await opener.click();
    await expect(page.getByRole("dialog", { name: "Item details" })).toBeVisible();
    await settled(page);

    // The page is inert behind the sheet, so drive app state directly (as a
    // shortcut or a route change would).
    await page.evaluate(() => window.__frameDemo!.setNavOpen(true));
    const nav = page.getByRole("dialog", { name: "Navigation" });
    await expect(nav).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Item details" })).toHaveCount(0);
    await settled(page);
    expect(await exposedDialogs(page)).toEqual(["Navigation"]);
    expect(await calls(page)).toEqual(["inspector:false"]);
    await expect(page.locator(".i258-frame")).not.toHaveAttribute("data-demo-selected");
    await expect.poll(() => focusIn(nav)).toBe(true);

    // Backdrop: closes nav, focus goes back to the record button.
    await page.mouse.click(380, 350);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await calls(page)).toEqual(["inspector:false", "nav:false"]);
    await expect(opener).toBeFocused();
  });

  test("resizing across both breakpoints with the inspector open", async ({ page }) => {
    await open(page, "sheet-harness");
    await page.getByRole("button", { name: "Open Example record 3" }).click();
    await expect(page.getByRole("dialog", { name: "Item details" })).toBeVisible();

    await page.setViewportSize({ width: 900, height: 700 });
    await expect(page.getByRole("dialog", { name: "Item details" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 700 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("complementary", { name: "Item details" })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 700 });
    await expect(page.getByRole("dialog", { name: "Item details" })).toBeVisible();
    // Nothing was closed along the way; the record is still the app's.
    expect(await calls(page)).toEqual([]);
    await expect(page.locator(".i258-frame")).toHaveAttribute("data-demo-selected", "item-3");
  });

  test("nav open, widened to 900px: nav closes, the inspector is untouched", async ({ page }) => {
    await open(page, "sheet-harness");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
    await page.setViewportSize({ width: 900, height: 700 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await calls(page)).toEqual(["nav:false"]);
    expect(await activeIsBody(page)).toBe(false);
  });
});

test.describe("hydration with the nav sheet open", () => {
  test("390px: the sheet opens once the viewport is known and stays open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await open(page, "hydrate-nav-open");
    await expect(page.getByTestId("hydration-errors")).toHaveText("");
    const nav = page.getByRole("dialog", { name: "Navigation" });
    await expect(nav).toBeVisible();
    await settled(page);
    await page.waitForTimeout(200);
    await expect(nav).toBeVisible();
    expect(await calls(page)).toEqual([]);

    // A genuine widen still closes it, and says so.
    await page.setViewportSize({ width: 1024, height: 700 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await calls(page)).toEqual(["nav:false"]);
    await page.setViewportSize({ width: 390, height: 700 });
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("1280px: no sheet, and no close reported without a narrow → wide change", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await open(page, "hydrate-nav-open");
    await expect(page.getByTestId("hydration-errors")).toHaveText("");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await calls(page)).toEqual([]);
  });
});

/** Drawn widths and what each handle announces. */
async function panes(page: Page) {
  return page.evaluate(() => {
    const w = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().width) : null;
    };
    const handle = (name: string) => {
      const el = document.querySelector(`[role='separator'][aria-label='${name}']`);
      return el
        ? {
            now: Number(el.getAttribute("aria-valuenow")),
            min: Number(el.getAttribute("aria-valuemin")),
            max: Number(el.getAttribute("aria-valuemax")),
          }
        : null;
    };
    return {
      frame: w(".i258-frame"),
      sidebar: w(".i258-frame__sidebar"),
      main: w(".i258-frame__main"),
      inspector: w(".i258-frame__inspector"),
      sidebarHandle: handle("Resize sidebar"),
      inspectorHandle: handle("Resize inspector"),
    };
  });
}

/** The inspector's close button is on screen and is what a click there hits. */
async function closeReachable(page: Page) {
  const box = await page.getByRole("button", { name: "Close inspector" }).boundingBox();
  if (!box) return false;
  const vw = page.viewportSize()!.width;
  if (box.x < 0 || box.x + box.width > vw) return false;
  return page.evaluate(
    ({ x, y }) => !!document.elementFromPoint(x, y)?.closest("[aria-label='Close inspector']"),
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
}

async function drag(page: Page, name: string, dx: number) {
  const box = (await page.getByRole("separator", { name }).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y);
  await page.mouse.move(x + dx, y);
  await page.mouse.up();
}

test.describe("pane widths fit the frame", () => {
  test("980px, End on both handles: main keeps 320px, the inspector stays usable", async ({ page }) => {
    await page.setViewportSize({ width: 980, height: 700 });
    await open(page, "default");
    await page.getByRole("button", { name: "Open Example record 1" }).click();
    await page.getByRole("separator", { name: "Resize sidebar" }).focus();
    await page.keyboard.press("End");
    await page.getByRole("separator", { name: "Resize inspector" }).focus();
    await page.keyboard.press("End");

    const p = await panes(page);
    // Sidebar grows until the inspector is at its min; main keeps its min.
    expect(p).toMatchObject({
      frame: 980,
      sidebar: 340,
      inspector: 320,
      main: 320,
      sidebarHandle: { now: 340, min: 200, max: 340 },
      inspectorHandle: { now: 320, min: 320, max: 320 },
    });
    expect(await closeReachable(page)).toBe(true);
  });

  test("controlled widths are fitted, not rewritten; they come back as the window widens", async ({ page }) => {
    await page.setViewportSize({ width: 980, height: 700 });
    await open(page, "controlled-widths");
    await expect(page.getByTestId("stored-widths")).toHaveText("Stored widths: sidebar 400, inspector 720");
    expect(await panes(page)).toMatchObject({
      sidebar: 340,
      inspector: 320,
      main: 320,
      sidebarHandle: { now: 340, max: 340 },
      inspectorHandle: { now: 320, max: 320 },
    });
    expect(await closeReachable(page)).toBe(true);

    await page.setViewportSize({ width: 1280, height: 700 });
    await expect.poll(async () => (await panes(page)).inspector).toBe(560);
    expect(await panes(page)).toMatchObject({ sidebar: 400, main: 320, inspectorHandle: { now: 560, max: 560 } });

    await page.setViewportSize({ width: 1600, height: 700 });
    await expect.poll(async () => (await panes(page)).inspector).toBe(720);
    expect(await panes(page)).toMatchObject({ sidebar: 400, main: 480 });
    // No feedback: fitting never wrote back to app state.
    expect(await calls(page)).toEqual([]);

    // A real resize does: ← on the inspector's start-edge handle widens it,
    // → narrows it.
    await page.getByRole("separator", { name: "Resize inspector" }).focus();
    await page.keyboard.press("ArrowRight");
    expect(await calls(page)).toEqual(["inspector-width:704"]);
    await expect(page.getByTestId("stored-widths")).toHaveText("Stored widths: sidebar 400, inspector 704");
  });

  test("container narrowing (viewport unchanged)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await open(page, "default");
    await page.getByRole("button", { name: "Open Example record 1" }).click();
    await page.locator("#storybook-root").evaluate((el) => (el.style.width = "1000px"));
    await page.getByRole("separator", { name: "Resize inspector" }).focus();
    await page.keyboard.press("End");
    await expect.poll(async () => (await panes(page)).inspector).toBe(440);
    expect(await panes(page)).toMatchObject({ frame: 1000, sidebar: 240, main: 320, inspectorHandle: { max: 440 } });

    await page.locator("#storybook-root").evaluate((el) => (el.style.width = "900px"));
    await expect.poll(async () => (await panes(page)).inspector).toBe(340);
    expect(await panes(page)).toMatchObject({ main: 320, inspectorHandle: { now: 340, max: 340 } });
    expect(await closeReachable(page)).toBe(true);
  });

  test("rail: the inspector fits around the rail's real width", async ({ page }) => {
    await page.setViewportSize({ width: 980, height: 700 });
    await open(page, "compact-dark-rail", "dark");
    await page.getByRole("button", { name: "Open Example record 1" }).click();
    await page.getByRole("separator", { name: "Resize inspector" }).focus();
    await page.keyboard.press("End");
    const p = await panes(page);
    expect(p.sidebarHandle).toBeNull();
    expect(p.main).toBe(320);
    expect(p.sidebar! + p.main! + p.inspector!).toBe(980);
    expect(p.inspectorHandle).toMatchObject({ now: p.inspector, max: p.inspector });
  });

  test("hidden sidebar: the inspector may take everything but main's minimum", async ({ page }) => {
    await page.setViewportSize({ width: 980, height: 700 });
    await open(page, "sidebar-hidden");
    await page.getByRole("separator", { name: "Resize inspector" }).focus();
    await page.keyboard.press("End");
    expect(await panes(page)).toMatchObject({
      sidebar: null,
      main: 320,
      inspector: 660,
      inspectorHandle: { now: 660, max: 660 },
    });
  });

  test("pointer drag clamps to the fitted range", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await open(page, "default");
    await drag(page, "Resize sidebar", 100);
    expect(await panes(page)).toMatchObject({ sidebar: 340, sidebarHandle: { now: 340, max: 400 } });
    await drag(page, "Resize sidebar", 1000);
    expect(await panes(page)).toMatchObject({ sidebar: 400, sidebarHandle: { now: 400 } });

    await page.getByRole("button", { name: "Open Example record 1" }).click();
    // ← widens a start-edge handle; it stops where main keeps 320px.
    await drag(page, "Resize inspector", -1000);
    expect(await panes(page)).toMatchObject({ main: 320, inspector: 560, inspectorHandle: { now: 560, max: 560 } });
    await drag(page, "Resize inspector", 1000);
    expect(await panes(page)).toMatchObject({ inspector: 320, inspectorHandle: { now: 320 } });
    // Not stuck in resize mode afterwards.
    expect(await page.evaluate(() => "i258Resizing" in document.documentElement.dataset)).toBe(false);
  });

  test("right to left: drags and arrows mirror, widths still fit", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await open(page, "right-to-left");
    const geo = await page.evaluate(() => ({
      sidebarLeft: document.querySelector(".i258-frame__sidebar")!.getBoundingClientRect().left,
      inspectorLeft: document.querySelector(".i258-frame__inspector")!.getBoundingClientRect().left,
    }));
    expect(geo.sidebarLeft).toBeGreaterThan(geo.inspectorLeft);

    // Sidebar on the right: dragging left widens it.
    await drag(page, "Resize sidebar", -100);
    expect(await panes(page)).toMatchObject({ sidebar: 340, sidebarHandle: { now: 340 } });
    // Inspector on the left: dragging right widens it, up to main's minimum.
    await drag(page, "Resize inspector", 100);
    expect(await panes(page)).toMatchObject({ inspector: 500, inspectorHandle: { now: 500 } });
    await drag(page, "Resize inspector", 1000);
    expect(await panes(page)).toMatchObject({ main: 320, inspector: 620, inspectorHandle: { now: 620, max: 620 } });
    // → widens the inspector's handle in RTL; already at the max.
    await page.getByRole("separator", { name: "Resize inspector" }).focus();
    await page.keyboard.press("ArrowLeft");
    expect(await panes(page)).toMatchObject({ inspector: 604 });
    await page.keyboard.press("ArrowRight");
    expect(await panes(page)).toMatchObject({ inspector: 620 });
  });
});

/** WCAG contrast ratio between two computed rgb() colours. */
function contrastScript() {
  const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
  const lum = (c: string) => {
    const [r, g, b] = parse(c).slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x! + 0.05) / (y! + 0.05);
  };
  /** The first opaque background at or above `el`. */
  const bg = (el: Element | null): string => {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      const a = parse(c)[3];
      if (c && (a === undefined || a > 0)) return c;
    }
    return "rgb(255, 255, 255)";
  };
  return { ratio, bg };
}

test.describe("resize handles are visible at rest", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const [story, theme] of [
    ["default", "light"],
    ["default", "dark"],
    ["compact-dark-rail", "dark"],
  ] as const) {
    test(`${story}, ${theme}: a 3:1 grip on each handle, clear of the rows`, async ({ page }) => {
      await open(page, story, theme);
      if (story === "compact-dark-rail") await page.getByRole("button", { name: "Expand sidebar" }).click();
      await page.getByRole("button", { name: "Open Example record 1" }).click();
      await page.mouse.move(640, 790);
      const r = await page.evaluate(
        ({ src }) => {
          const { ratio, bg } = new Function(`return (${src})()`)() as ReturnType<typeof contrastScript>;
          return [...document.querySelectorAll<HTMLElement>(".i258-resize-handle")].map((h) => {
            const grip = getComputedStyle(h, "::before");
            const box = h.getBoundingClientRect();
            const y = box.top + box.height / 2;
            // The colours either side of the edge the grip sits on: for the
            // sidebar, its surface and the main pane; for the inspector, the
            // main pane and its own background.
            const sideA = document.elementFromPoint(box.left - 4, y);
            const sideB = document.elementFromPoint(box.right + 2, y);
            const pane = getComputedStyle(h.closest(".i258-frame__sidebar, .i258-frame__inspector")!);
            const hairline = h.dataset["edge"] === "end" ? pane.borderInlineEndColor : pane.borderInlineStartColor;
            const a = bg(sideA);
            const b = bg(sideB);
            return {
              label: h.getAttribute("aria-label"),
              gripSize: [parseFloat(grip.width), parseFloat(grip.height)],
              grip: Math.min(ratio(grip.backgroundColor, a), ratio(grip.backgroundColor, b)),
              hairline: Math.min(ratio(hairline, a), ratio(hairline, b)),
              // A row next to the grip would be a different background.
              rowBeside: !!sideA?.closest(".i258-sidebar__item"),
            };
          });
        },
        { src: contrastScript.toString() },
      );
      expect(r).toHaveLength(2);
      for (const h of r) {
        expect(h.gripSize, h.label!).toEqual([4, 24]);
        expect(h.grip, h.label!).toBeGreaterThanOrEqual(3);
        // The control is not left to the hairline, which is decorative.
        expect(h.hairline, h.label!).toBeLessThan(3);
        expect(h.rowBeside, h.label!).toBe(false);
      }
    });
  }

  test("focus turns the grip and edge to the indicator colour", async ({ page }) => {
    await open(page, "default");
    const handle = page.getByRole("separator", { name: "Resize sidebar" });
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    const indicator = await page.evaluate(() => {
      const p = document.createElement("div");
      p.style.background = "var(--i258-indicator)";
      document.querySelector(".i258-frame")!.append(p);
      const c = getComputedStyle(p).backgroundColor;
      p.remove();
      return c;
    });
    await expect
      .poll(() =>
        handle.evaluate((h) => [
          getComputedStyle(h, "::before").backgroundColor,
          getComputedStyle(h, "::after").backgroundColor,
        ]),
      )
      .toEqual([indicator, indicator]);
  });

  test("forced colours: the grip is drawn in a system colour at rest", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "default");
    await page.mouse.move(640, 790);
    const s = await page.evaluate(() => {
      const sys = (v: string) => {
        const p = document.createElement("div");
        p.style.cssText = `background: ${v}; forced-color-adjust: none`;
        document.body.append(p);
        const c = getComputedStyle(p).backgroundColor;
        p.remove();
        return c;
      };
      const h = document.querySelector(".i258-resize-handle")!;
      return { grip: getComputedStyle(h, "::before").backgroundColor, text: sys("CanvasText"), canvas: sys("Canvas") };
    });
    expect(s.grip).toBe(s.text);
    expect(s.grip).not.toBe(s.canvas);
  });
});

async function useBoxSizing(page: Page, boxSizing: "content-box" | "border-box") {
  await page.addStyleTag({ content: `*, *::before, *::after { box-sizing: ${boxSizing}; }` });
}

for (const boxSizing of ["content-box", "border-box"] as const) {
  test.describe(`coarse breadcrumbs, ${boxSizing}`, () => {
    test.use({ hasTouch: true, isMobile: true });

    for (const [story, theme, viewport] of [
      ["default", "light", { width: 1280, height: 800 }],
      ["compact-dark-rail", "dark", { width: 1280, height: 800 }],
      // Header wraps.
      ["long-content", "light", { width: 320, height: 568 }],
      ["compact-dark-rail", "dark", { width: 390, height: 700 }],
    ] as const) {
      test(`${story} ${viewport.width}px: breadcrumb links are 44×44 and inside the header`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await open(page, story, theme);
        await useBoxSizing(page, boxSizing);
        const link = page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Workspace" });
        const box = (await link.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        const header = (await page.getByRole("banner").boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(header.y);
        expect(box.y + box.height).toBeLessThanOrEqual(header.y + header.height + 0.5);
        // What a tap at the link's corners hits.
        const hits = await page.evaluate(
          (b) =>
            [
              [b.x + 1, b.y + 1],
              [b.x + b.width - 1, b.y + b.height - 1],
            ].every(([x, y]) => document.elementFromPoint(x!, y!)?.closest("a")?.textContent === "Workspace"),
          box,
        );
        expect(hits).toBe(true);
      });
    }
  });
}
