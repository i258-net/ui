import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  resolveTheme,
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
