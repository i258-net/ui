import { createRequire } from "node:module";
import { expect, test, type Page } from "@playwright/test";

/**
 * Geometry, not pixels — no screenshots here.
 *
 * Target sizes are promised in CSS (24px on fine pointers, 44×44 on coarse)
 * but nothing visual shows a hit area, so these hit-test the compiled
 * stylesheet in a real browser. Markup is the class contract only, not the
 * React components: what is under test is the shipped CSS, under both
 * box-sizing models a consumer might have, at both densities.
 *
 * The checkbox's visible edge is 1rem under border-box and 1rem plus its 1px
 * border under content-box; that is the visible box as it already ships and
 * is not what this guards. The target is a fixed centred size either way.
 */

const CHECKBOX_EDGE = { "border-box": 16, "content-box": 18 } as const;

const require = createRequire(import.meta.url);
const STYLES = require.resolve("@i258/ui/styles.css");

type BoxSizing = "content-box" | "border-box";
type Density = "comfortable" | "compact";

async function mount(page: Page, boxSizing: BoxSizing, density: Density) {
  await page.setContent(`<!doctype html><html data-theme="light"><body></body></html>`);
  await page.addStyleTag({ path: STYLES });
  // Unlayered, as a consumer reset would be, so it beats @layer i258-components.
  await page.addStyleTag({
    content: `*, *::before, *::after { box-sizing: ${boxSizing}; } body { margin: 0; }`,
  });
  await page.evaluate((d) => {
    document.body.innerHTML = `
      <div data-density="${d}" style="padding: 40px; display: flex; flex-wrap: wrap; gap: 60px; align-items: center">
        <span id="cb" class="i258-checkbox" role="checkbox" aria-checked="false" tabindex="0"></span>
        <div style="display: flex; align-items: center; gap: 8px">
          <span id="cb-labelled" class="i258-checkbox" role="checkbox" aria-checked="false" tabindex="0"></span>
          <label id="cb-label" class="i258-label">Accept terms</label>
        </div>
        <button id="btn-sm" class="i258-btn i258-btn--sm i258-btn--ghost">x</button>
        <button id="toggle" class="i258-btn i258-btn--sm i258-btn--ghost i258-theme-toggle" aria-label="Theme"></button>
        <button id="chip" class="i258-toggle-chip i258-toggle-chip--sm" data-state="off">x</button>
        <button id="choice" class="i258-choice i258-choice--chip i258-choice--sm">x</button>
        <div style="width: 320px"><button id="option" class="i258-choice i258-choice--option i258-choice--sm">Option</button></div>
      </div>`;
  }, density);
}

/**
 * The span along each axis, through the visible centre, of points that
 * hit-test to `id`, in quarter-pixel steps. Chromium resolves a point on a
 * box edge half a pixel early (a box from x=36 hits at 35.5 and misses at
 * 60), so a span is good to ±0.75px — tight enough to fail the 22px and 42px
 * targets a border-box consumer used to get.
 */
async function hitTest(page: Page, id: string) {
  return page.evaluate((id) => {
    const el = document.getElementById(id)!;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hits = (dx: number, dy: number) => {
      const t = document.elementFromPoint(cx + dx, cy + dy);
      return t === el || el.contains(t);
    };
    const span = (axis: "x" | "y") => {
      const at = (d: number) => (axis === "x" ? hits(d, 0) : hits(0, d));
      let lo = 0;
      let hi = 0;
      while (at(lo - 0.25)) lo -= 0.25;
      while (at(hi + 0.25)) hi += 0.25;
      return { lo, hi, size: hi - lo };
    };
    const x = span("x");
    const y = span("y");
    return {
      visible: { w: r.width, h: r.height },
      hit: { w: x.size, h: y.size },
      // Centred: the target reaches as far past one edge as the other.
      skew: { x: x.hi + x.lo, y: y.hi + y.lo },
    };
  }, id);
}

function expectTarget(t: Awaited<ReturnType<typeof hitTest>>, size: number, label: string) {
  for (const axis of ["w", "h"] as const) {
    expect(Math.abs(t.hit[axis] - size), `${label} ${axis} ${t.hit[axis]}`).toBeLessThanOrEqual(0.75);
  }
  for (const axis of ["x", "y"] as const) {
    expect(Math.abs(t.skew[axis]), `${label} skew ${axis}`).toBeLessThanOrEqual(1);
  }
}

for (const boxSizing of ["content-box", "border-box"] as const) {
  for (const density of ["comfortable", "compact"] as const) {
    test.describe(`${boxSizing}, ${density}`, () => {
      test("fine pointer: checkbox has a 24px target", async ({ page }) => {
        await mount(page, boxSizing, density);
        expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(false);
        for (const id of ["cb", "cb-labelled"]) {
          const t = await hitTest(page, id);
          expect(t.visible).toEqual({ w: CHECKBOX_EDGE[boxSizing], h: CHECKBOX_EDGE[boxSizing] });
          expectTarget(t, 24, id);
        }
      });

      test.describe("coarse pointer", () => {
        test.use({ hasTouch: true, isMobile: true });

        test("checkbox keeps its visible box with a 44×44 target", async ({ page }) => {
          await mount(page, boxSizing, density);
          expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
          for (const id of ["cb", "cb-labelled"]) {
            const t = await hitTest(page, id);
            expect(t.visible).toEqual({ w: CHECKBOX_EDGE[boxSizing], h: CHECKBOX_EDGE[boxSizing] });
            expectTarget(t, 44, id);
          }
          // The target overlaps the label's leading edge; that is the same
          // action (the label toggles it too), and the label beyond it is
          // still its own element.
          const labelFar = await page.evaluate(() => {
            const r = document.getElementById("cb-label")!.getBoundingClientRect();
            return document.elementFromPoint(r.right - 2, r.top + r.height / 2)?.id;
          });
          expect(labelFar).toBe("cb-label");
        });

        test("short controls are at least 44×44", async ({ page }) => {
          await mount(page, boxSizing, density);
          for (const id of ["btn-sm", "toggle", "chip", "choice", "option"]) {
            const { visible, hit } = await hitTest(page, id);
            expect.soft(visible.w, `${id} width`).toBeGreaterThanOrEqual(44);
            expect.soft(visible.h, `${id} height`).toBeGreaterThanOrEqual(44);
            expect.soft(hit.w, `${id} hit width`).toBeGreaterThanOrEqual(43.5);
            expect.soft(hit.h, `${id} hit height`).toBeGreaterThanOrEqual(43.5);
          }
          // Option rows stay full-width and start-aligned; chips centre a
          // short label in the widened pill.
          const justify = await page.evaluate(() =>
            Object.fromEntries(
              ["chip", "choice", "option"].map((id) => [
                id,
                getComputedStyle(document.getElementById(id)!).justifyContent,
              ]),
            ),
          );
          expect(justify).toEqual({ chip: "center", choice: "center", option: "flex-start" });
        });
      });
    });
  }
}
