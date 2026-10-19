import { expect, test, type Page } from "@playwright/test";

/**
 * Behaviour, not pixels — no screenshots here.
 *
 * target-size.spec.ts measures one checkbox's target in isolation. This
 * clicks real React <Checkbox>es with associated <Label>s laid out as close
 * as list screens put them (Primitives/Checkbox/Close Spacing: 12px apart in
 * a row, stacked with no gap) and checks that a click on any visible edge or
 * anywhere in a target changes that checkbox and no other. A hit area that
 * reached past the element without taking layout space failed this: on a
 * coarse pointer the next box's 44px target covered the previous box's
 * visible right edge and took its clicks.
 *
 * The same layout is run with `render={<button />} nativeButton`, where the
 * root is a real <button>: its UA border, padding and background must not
 * grow the target or paint round the drawn box.
 */

const STORIES = {
  span: "/iframe.html?id=primitives-checkbox--close-spacing&viewMode=story",
  button: "/iframe.html?id=primitives-checkbox--close-spacing-native-button&viewMode=story",
} as const;

type Root = keyof typeof STORIES;

type BoxSizing = "content-box" | "border-box";
type Density = "comfortable" | "compact";

const NAMES = ["Row A", "Row B", "Row C", "Alpha", "Beta", "One", "Two", "Three"];

async function mount(page: Page, root: Root, boxSizing: BoxSizing, density: Density) {
  await page.goto(STORIES[root], { waitUntil: "networkidle" });
  const story = page.getByTestId("close-spacing");
  await story.waitFor({ state: "visible", timeout: 15_000 });
  // Unlayered, as a consumer reset would be, so it beats @layer i258-components.
  await page.addStyleTag({
    content: `*, *::before, *::after { box-sizing: ${boxSizing}; }`,
  });
  await story.evaluate((el, d) => el.setAttribute("data-density", d), density);
}

/** aria-checked of every checkbox in the story, in document order. */
function states(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[role="checkbox"]')].map((el) => el.getAttribute("aria-checked")),
  );
}

async function indexOf(page: Page, name: string) {
  const box = page.getByRole("checkbox", { name, exact: true });
  return box.evaluate((el) => [...document.querySelectorAll('[role="checkbox"]')].indexOf(el));
}

/** The element's box (the target) and its drawn ::before box (what is seen). */
async function geometry(page: Page, name: string) {
  return page.getByRole("checkbox", { name, exact: true }).evaluate((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el, "::before");
    // Falls back to the element's own box for CSS that draws no ::before,
    // so the clicks below still mean something against older stylesheets.
    const size =
      s.content === "none"
        ? r.width
        : parseFloat(s.width) + (s.boxSizing === "content-box" ? parseFloat(s.borderLeftWidth) * 2 : 0);
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return {
      target: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height },
      visible: { left: cx - size / 2, top: cy - size / 2, right: cx + size / 2, bottom: cy + size / 2, size },
      cx,
      cy,
    };
  });
}

type Geometry = Awaited<ReturnType<typeof geometry>>;

/** Points 1px inside each visible edge and each target edge and corner. */
function probes({ target: t, visible: v, cx, cy }: Geometry) {
  return {
    "visible left": [v.left + 1, cy],
    "visible right": [v.right - 1, cy],
    "visible top": [cx, v.top + 1],
    "visible bottom": [cx, v.bottom - 1],
    "target left": [t.left + 1, cy],
    "target right": [t.right - 1, cy],
    "target top": [cx, t.top + 1],
    "target bottom": [cx, t.bottom - 1],
    "target top-left": [t.left + 1, t.top + 1],
    "target bottom-right": [t.right - 1, t.bottom - 1],
  } as const;
}

function overlaps(a: Geometry["target"], b: Geometry["target"]) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

async function press(page: Page, coarse: boolean, x: number, y: number) {
  if (coarse) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

function flip(state: string | null) {
  return state === "true" ? "false" : "true";
}

async function run(page: Page, root: Root, boxSizing: BoxSizing, density: Density, coarse: boolean) {
  await mount(page, root, boxSizing, density);
  expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(coarse);
  const size = coarse ? 44 : 24;
  const edge = boxSizing === "border-box" ? 16 : 18;

  // The root draws nothing of its own: no UA button border, padding,
  // background or native appearance, whatever element Base UI renders.
  const chrome = await page.evaluate(() =>
    [...document.querySelectorAll('[role="checkbox"]')].map((el) => {
      const s = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].join(" "),
        padding: s.padding,
        background: s.backgroundColor,
        appearance: s.appearance,
      };
    }),
  );
  for (const c of chrome) {
    expect.soft(c, "checkbox root chrome").toEqual({
      tag: root,
      border: "0px 0px 0px 0px",
      padding: "0px",
      background: "rgba(0, 0, 0, 0)",
      appearance: "none",
    });
  }

  const geo = Object.fromEntries(
    await Promise.all(NAMES.map(async (n) => [n, await geometry(page, n)] as const)),
  );

  // Each target is its own reserved space: the right size, with the small
  // box drawn inside it, and clear of its neighbours'.
  for (const n of NAMES) {
    expect.soft(geo[n].target.w, `${n} target width`).toBeCloseTo(size, 1);
    expect.soft(geo[n].target.h, `${n} target height`).toBeCloseTo(size, 1);
    expect.soft(geo[n].visible.size, `${n} visible box`).toBe(edge);
  }
  for (const [a, b] of [
    ["Row A", "Row B"],
    ["Row B", "Row C"],
    ["Alpha", "Beta"],
    ["One", "Two"],
    ["Two", "Three"],
  ]) {
    expect.soft(overlaps(geo[a].target, geo[b].target), `${a} / ${b} targets overlap`).toBe(false);
  }

  // Every probe point belongs to its own checkbox and toggles only it.
  for (const n of NAMES) {
    const i = await indexOf(page, n);
    for (const [where, [x, y]] of Object.entries(probes(geo[n]))) {
      const hit = await page.evaluate(([x, y]) => {
        const box = document.elementFromPoint(x, y)?.closest('[role="checkbox"]');
        return box ? [...document.querySelectorAll('[role="checkbox"]')].indexOf(box) : -1;
      }, [x, y] as const);
      expect.soft(hit, `${n} ${where}: hit-tests to ${n}`).toBe(i);
      const before = await states(page);
      await press(page, coarse, x, y);
      const expected = [...before];
      expected[i] = flip(before[i]);
      expect.soft(await states(page), `${n} ${where} (${x}, ${y})`).toEqual(expected);
    }
  }

  // The gap between two bare row checkboxes belongs to neither. A mouse
  // click there changes nothing; a tap may still be snapped to the nearer
  // box by Chromium's touch adjustment, which is the browser, not the CSS,
  // so on touch it is held to changing at most one.
  {
    const x = (geo["Row A"].target.right + geo["Row B"].target.left) / 2;
    const y = geo["Row A"].cy;
    const hit = await page.evaluate(
      ([x, y]) => !!document.elementFromPoint(x, y)?.closest('[role="checkbox"]'),
      [x, y] as const,
    );
    expect.soft(hit, "gap between Row A and Row B hit-tests to a checkbox").toBe(false);
    const before = await states(page);
    await press(page, coarse, x, y);
    const after = await states(page);
    const changed = after.filter((s, i) => s !== before[i]).length;
    if (coarse) expect.soft(changed, "gap tap changed more than one box").toBeLessThanOrEqual(1);
    else expect.soft(after, "gap between Row A and Row B").toEqual(before);
  }

  // A label toggles its own checkbox and nothing else.
  for (const [label, n] of [
    ["Alpha", "Alpha"],
    ["Beta", "Beta"],
    ["One", "One"],
    ["Two", "Two"],
    ["Three", "Three"],
  ]) {
    const i = await indexOf(page, n);
    const before = await states(page);
    const r = (await page.locator("label", { hasText: new RegExp(`^${label}$`) }).boundingBox())!;
    await press(page, coarse, r.x + r.width - 2, r.y + r.height / 2);
    const expected = [...before];
    expected[i] = flip(before[i]);
    expect.soft(await states(page), `label ${label}`).toEqual(expected);
  }

  // Disabled holds: no toggle, and the attribute Base UI chose for the root.
  {
    const disabled = page.getByRole("checkbox", { name: "Row disabled", exact: true });
    await expect(disabled).toBeDisabled();
    if (root === "button") await expect(disabled).toHaveAttribute("disabled", "");
    else await expect(disabled).toHaveAttribute("aria-disabled", "true");
    const g = await geometry(page, "Row disabled");
    expect.soft(g.target.w, "Row disabled target width").toBeCloseTo(size, 1);
    const before = await states(page);
    await press(page, coarse, g.cx, g.cy);
    expect.soft(await states(page), "disabled box").toEqual(before);
  }

  // Role, name, mixed state and keyboard are untouched.
  const mixed = page.getByRole("checkbox", { name: "Row mixed", exact: true });
  await expect(mixed).toHaveAttribute("aria-checked", "mixed");
  const rowA = page.getByRole("checkbox", { name: "Row A", exact: true });
  const iA = await indexOf(page, "Row A");
  await rowA.focus();
  const before = await states(page);
  await page.keyboard.press("Space");
  const expected = [...before];
  expected[iA] = flip(before[iA]);
  expect(await states(page), "Space toggles the focused box only").toEqual(expected);

  // Tab reaches the next box, and the ring is drawn round the box, not the
  // target or the button.
  await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => {
    const el = document.activeElement!;
    return {
      name: el.getAttribute("aria-label"),
      root: getComputedStyle(el).outlineStyle,
      box: getComputedStyle(el, "::before").outlineStyle,
    };
  });
  expect(ring).toEqual({ name: "Row B", root: "none", box: "solid" });
}

// Density does not reach the checkbox (--i258-control-xs is density-fixed);
// it is run on the default span root to prove that, and the button root is
// run at the default density.
const CONFIGS = [
  ...(["comfortable", "compact"] as const).map((density) => ({ root: "span" as const, density })),
  { root: "button" as const, density: "comfortable" as const },
];

for (const { root, density } of CONFIGS) {
  for (const boxSizing of ["content-box", "border-box"] as const) {
    test.describe(`${root} root, ${boxSizing}, ${density}`, () => {
      test("fine pointer: each click changes only the checkbox it lands on", async ({ page }) => {
        await run(page, root, boxSizing, density, false);
      });

      test.describe("coarse pointer", () => {
        test.use({ hasTouch: true, isMobile: true });

        test("each tap changes only the checkbox it lands on", async ({ page }) => {
          await run(page, root, boxSizing, density, true);
        });
      });
    });
  }
}

/** FormField's horizontal layout centres the label's first line on the target. */
async function formField(page: Page, coarse: boolean) {
  await page.goto("/iframe.html?id=primitives-formfield--with-checkbox&viewMode=story", {
    waitUntil: "networkidle",
  });
  const box = page.locator('#storybook-root [role="checkbox"]');
  await box.waitFor();
  const centres = await page.evaluate(() => {
    const centre = (sel: string) => {
      const r = document.querySelector(`#storybook-root ${sel}`)!.getBoundingClientRect();
      return { mid: r.top + r.height / 2, h: r.height };
    };
    return { box: centre('[role="checkbox"]'), label: centre("label") };
  });
  expect(centres.box.h).toBeCloseTo(coarse ? 44 : 24, 1);
  expect(Math.abs(centres.box.mid - centres.label.mid)).toBeLessThanOrEqual(0.5);
  const r = (await page.locator("#storybook-root label").boundingBox())!;
  await press(page, coarse, r.x + r.width - 2, r.y + r.height / 2);
  await expect(box).toHaveAttribute("aria-checked", "true");
}

test("FormField, fine pointer: label line centred on the checkbox", async ({ page }) => {
  await formField(page, false);
});

test.describe("FormField, coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true });

  test("label line centred on the checkbox", async ({ page }) => {
    await formField(page, true);
  });
});
