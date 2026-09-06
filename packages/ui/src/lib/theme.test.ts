import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_THEME,
  resolveTheme,
  subscribeToTheme,
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
