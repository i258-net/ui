import { describe, expect, it } from "vitest";

import { fitPanes, inspectorFits, type FitInput } from "./frame-fit.js";

const defaults: FitInput = {
  frame: null,
  mainMin: 320,
  sidebar: 240,
  sidebarMin: 200,
  sidebarMax: 400,
  sidebarFixed: null,
  inspector: null,
  inspectorMin: 320,
  inspectorMax: 720,
};
const fit = (o: Partial<FitInput>) => fitPanes({ ...defaults, ...o });

/** Every number a handle would announce is finite and not negative. */
function sane(r: ReturnType<typeof fitPanes>) {
  for (const v of [r.sidebar, r.sidebarMin, r.sidebarMax, r.inspector, r.inspectorMin, r.inspectorMax]) {
    if (v == null) continue;
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  }
  if (r.sidebar != null) {
    expect(r.sidebarMin).toBeLessThanOrEqual(r.sidebar);
    expect(r.sidebar).toBeLessThanOrEqual(r.sidebarMax);
  }
  if (r.inspector != null) {
    expect(r.inspectorMin).toBeLessThanOrEqual(r.inspector);
    expect(r.inspector).toBeLessThanOrEqual(r.inspectorMax);
  }
}

describe("fitPanes", () => {
  it("unmeasured: stored widths clamped to their own range", () => {
    const r = fit({ sidebar: 400, inspector: 720 });
    expect(r).toMatchObject({ sidebar: 400, sidebarMax: 400, inspector: 720, inspectorMax: 720, squeezed: false });
  });

  it("980px, controlled 400/720: main keeps 320, both panes stay usable", () => {
    const r = fit({ frame: 980, sidebar: 400, inspector: 720 });
    expect(r).toMatchObject({ sidebar: 340, inspector: 320, squeezed: false });
    expect(980 - r.sidebar! - r.inspector!).toBe(320);
    sane(r);
  });

  it("450px embedded, sidebar only: shared in proportion to the minima, nothing past the edge", () => {
    const r = fit({ frame: 450 });
    expect(r.squeezed).toBe(true);
    expect(r.sidebar).toBe(Math.floor((450 * 200) / 520));
    expect(r).toMatchObject({ sidebarMin: r.sidebar, sidebarMax: r.sidebar });
    expect(450 - r.sidebar!).toBeGreaterThan(0);
    sane(r);
  });

  it("an inline inspector that does not fit is squeezed too, never past the frame", () => {
    for (const frame of [450, 300, 120, 1]) {
      const r = fit({ frame, inspector: 400 });
      expect(r.squeezed).toBe(true);
      expect(r.sidebar! + r.inspector!).toBeLessThanOrEqual(frame);
      sane(r);
    }
  });

  it("a rail is not squeezed; the main pane takes what is left", () => {
    const r = fit({ frame: 300, sidebar: null, sidebarFixed: 56 });
    expect(r).toMatchObject({ sidebar: null, squeezed: true });
    const wide = fit({ frame: 980, sidebar: null, sidebarFixed: 56, inspector: 2000 });
    expect(wide).toMatchObject({ inspector: 604, inspectorMax: 604, squeezed: false });
  });

  it("custom minima and maxima", () => {
    // mainMinWidth 0: the panes may take the whole frame.
    expect(fit({ frame: 980, mainMin: 0, sidebar: 400, inspector: 720 })).toMatchObject({
      sidebar: 400,
      inspector: 580,
    });
    // A max below its min is the min.
    expect(fit({ frame: 1600, sidebarMin: 300, sidebarMax: 100, sidebar: 50 })).toMatchObject({
      sidebar: 300,
      sidebarMin: 300,
      sidebarMax: 300,
    });
    // A large main minimum squeezes before the panes reach theirs.
    const r = fit({ frame: 900, mainMin: 800, inspector: 400 });
    expect(r.squeezed).toBe(true);
    sane(r);
  });

  it("no negative or NaN bounds from bad input", () => {
    const bad = [NaN, -50, Infinity, -Infinity];
    for (const v of bad) {
      for (const key of ["mainMin", "sidebarMin", "sidebarMax", "inspectorMin", "inspectorMax", "sidebar", "inspector"] as const) {
        for (const frame of [null, 0, -10, NaN, 450, 1280]) {
          const r = fit({ frame, inspector: 400, [key]: v });
          // Infinity is a legitimate "no maximum" while unmeasured.
          if (frame == null || !(frame > 0)) {
            if (key === "sidebarMax" || key === "inspectorMax") continue;
          }
          sane(r);
        }
      }
    }
  });

  it("a frame of 0 or less counts as unmeasured, not as too narrow", () => {
    expect(fit({ frame: 0 }).squeezed).toBe(false);
    expect(fit({ frame: -1, inspector: 400 }).inspector).toBe(400);
  });
});

describe("inspectorFits", () => {
  const base = { frame: 980, sidebarFloor: 200, mainMin: 320, inspectorMin: 320 };
  it("fits at the accepted full-viewport defaults", () => {
    expect(inspectorFits(base)).toBe(true);
    expect(inspectorFits({ ...base, frame: 840 })).toBe(true);
  });
  it("does not fit in a narrower frame", () => {
    expect(inspectorFits({ ...base, frame: 839 })).toBe(false);
    expect(inspectorFits({ ...base, frame: 450 })).toBe(false);
    expect(inspectorFits({ ...base, frame: 450, sidebarFloor: 0, mainMin: 0, inspectorMin: 450 })).toBe(true);
  });
  it("unknown or zero widths fit (server, hidden container)", () => {
    expect(inspectorFits({ ...base, frame: null })).toBe(true);
    expect(inspectorFits({ ...base, frame: 0 })).toBe(true);
  });
  it("bad minima count as 0", () => {
    expect(inspectorFits({ frame: 320, sidebarFloor: NaN, mainMin: -5, inspectorMin: 320 })).toBe(true);
  });
});
