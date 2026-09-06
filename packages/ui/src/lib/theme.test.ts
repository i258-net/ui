import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_THEME,
  readAppliedTheme,
  resolveTheme,
  subscribeToTheme,
  themeHostOf,
  themeScript,
} from "./theme.js";

describe("resolveTheme", () => {
  it("accepts light and dark", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("falls back to DEFAULT_THEME", () => {
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
    expect(resolveTheme(undefined)).toBe(DEFAULT_THEME);
    expect(resolveTheme("system")).toBe(DEFAULT_THEME);
    expect(resolveTheme("")).toBe(DEFAULT_THEME);
  });
});

describe("themeScript", () => {
  it("is a single-line IIFE that mentions the storage key and default", () => {
    const src = themeScript("i258-theme");
    expect(src.includes("\n")).toBe(false);
    expect(src).toContain("i258-theme");
    expect(src).toContain(DEFAULT_THEME);
    expect(src.startsWith("(function(){")).toBe(true);
  });
});

/**
 * `packages/ui` runs vitest under node — no jsdom in the tree, and adding one
 * for four assertions is not worth the dependency. `subscribeToTheme` only
 * touches `addEventListener`/`removeEventListener`, so a stub window exercises
 * the whole function. Real `storage`-event delivery between tabs is covered by
 * `apps/workshop/vrt/theme-sync.spec.ts`.
 */
describe("subscribeToTheme", () => {
  type Listener = (event: StorageEvent) => void;

  function stubWindow() {
    const listeners = new Set<Listener>();
    vi.stubGlobal("window", {
      addEventListener: (type: string, fn: Listener) => {
        if (type === "storage") listeners.add(fn);
      },
      removeEventListener: (type: string, fn: Listener) => {
        if (type === "storage") listeners.delete(fn);
      },
    });
    return {
      listeners,
      fire(key: string | null, newValue: string | null) {
        for (const fn of listeners) fn({ key, newValue } as StorageEvent);
      },
    };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports a theme written under the watched key", () => {
    const dom = stubWindow();
    const onChange = vi.fn();
    subscribeToTheme(onChange, "i258-theme");
    dom.fire("i258-theme", "light");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("light");
  });

  it("ignores writes under other keys", () => {
    const dom = stubWindow();
    const onChange = vi.fn();
    subscribeToTheme(onChange, "i258-theme");
    dom.fire("some-other-key", "light");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("honours a custom storage key", () => {
    const dom = stubWindow();
    const onChange = vi.fn();
    subscribeToTheme(onChange, "app-theme");
    dom.fire("i258-theme", "light");
    expect(onChange).not.toHaveBeenCalled();
    dom.fire("app-theme", "light");
    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("falls back to DEFAULT_THEME on removal and on storage.clear()", () => {
    const dom = stubWindow();
    const onChange = vi.fn();
    subscribeToTheme(onChange, "i258-theme");
    dom.fire("i258-theme", null);
    // key === null is a whole-storage clear; it is not filtered out.
    dom.fire(null, null);
    expect(onChange).toHaveBeenNthCalledWith(1, DEFAULT_THEME);
    expect(onChange).toHaveBeenNthCalledWith(2, DEFAULT_THEME);
  });

  it("coerces an unknown stored value rather than passing it through", () => {
    const dom = stubWindow();
    const onChange = vi.fn();
    subscribeToTheme(onChange, "i258-theme");
    dom.fire("i258-theme", "system");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(DEFAULT_THEME);
  });

  it("detaches the listener on unsubscribe", () => {
    const dom = stubWindow();
    const onChange = vi.fn();
    subscribeToTheme(onChange, "i258-theme")();
    expect(dom.listeners.size).toBe(0);
    dom.fire("i258-theme", "light");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("is a no-op on the server", () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(() => subscribeToTheme(vi.fn())()).not.toThrow();
  });
});

/**
 * Same reasoning as `subscribeToTheme`: no jsdom in this tree. Each of these
 * touches exactly one DOM API, so a stub of that API covers the whole
 * function. The real computed-style read is exercised end to end by
 * `apps/workshop/vrt/primitives.spec.ts`.
 */
describe("readAppliedTheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function nodeComputing(value: string): Element {
    vi.stubGlobal("getComputedStyle", () => ({
      getPropertyValue: (property: string) =>
        property === "--i258-theme-is-dark" ? value : "",
    }));
    return {} as Element;
  }

  it("reads the theme from the property the stylesheet branches on", () => {
    expect(readAppliedTheme(nodeComputing("1"))).toBe("dark");
    expect(readAppliedTheme(nodeComputing("0"))).toBe("light");
  });

  it("trims the whitespace a computed custom property carries", () => {
    expect(readAppliedTheme(nodeComputing(" 1 "))).toBe("dark");
    expect(readAppliedTheme(nodeComputing("\n  0\n"))).toBe("light");
  });

  it("reads light when the stylesheet is absent", () => {
    expect(readAppliedTheme(nodeComputing(""))).toBe("light");
  });

  it("accepts any numeric form of dark, not just the literal 1", () => {
    // The CSS multiplies by this token, so `1.0` from a consumer theme block
    // renders dark; reporting it as light would put the label and the icon in
    // different themes.
    expect(readAppliedTheme(nodeComputing("1.0"))).toBe("dark");
  });

  it("reads a non-numeric value as light rather than throwing", () => {
    expect(readAppliedTheme(nodeComputing("true"))).toBe("light");
  });
});

describe("themeHostOf", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the nearest themed ancestor", () => {
    const host = { tag: "story-host" } as unknown as HTMLElement;
    const node = { closest: () => host } as unknown as Element;
    vi.stubGlobal("document", { documentElement: {} });
    expect(themeHostOf(node)).toBe(host);
  });

  it("selects on the data-theme attribute", () => {
    const selectors: string[] = [];
    const node = {
      closest: (selector: string) => {
        selectors.push(selector);
        return null;
      },
    } as unknown as Element;
    vi.stubGlobal("document", { documentElement: {} });
    themeHostOf(node);
    expect(selectors).toEqual(["[data-theme]"]);
  });

  it("falls back to documentElement when nothing above is themed", () => {
    const documentElement = { tag: "html" };
    const node = { closest: () => null } as unknown as Element;
    vi.stubGlobal("document", { documentElement });
    expect(themeHostOf(node)).toBe(documentElement);
  });
});
