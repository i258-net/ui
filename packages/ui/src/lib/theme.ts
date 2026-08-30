/** Resolved theme values written to `data-theme` and localStorage. */
export type Theme = "light" | "dark";

/** Default localStorage key shared by `themeScript` and `ThemeToggle`. */
export const THEME_STORAGE_KEY = "i258-theme";

/**
 * Fleet default when storage is empty or invalid.
 * Matches the forced-dark apps prior to the toggle (do not fall through to
 * `prefers-color-scheme` on first paint — that would flip light-OS users).
 */
export const DEFAULT_THEME: Theme = "dark";

export function resolveTheme(raw: string | null | undefined): Theme {
  return raw === "light" || raw === "dark" ? raw : DEFAULT_THEME;
}

export function readStoredTheme(
  storageKey: string = THEME_STORAGE_KEY,
): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    return resolveTheme(window.localStorage.getItem(storageKey));
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(
  theme: Theme,
  root: HTMLElement = document.documentElement,
): void {
  root.setAttribute("data-theme", theme);
}

export function persistTheme(
  theme: Theme,
  storageKey: string = THEME_STORAGE_KEY,
): void {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Private mode / quota — attribute still applies for this session.
  }
}

/**
 * Blocking inline script for `<html>` layouts. Run before first paint so the
 * page does not flash the wrong theme. Keep this string free of newlines that
 * would break a single-line `dangerouslySetInnerHTML` inject.
 */
export function themeScript(storageKey: string = THEME_STORAGE_KEY): string {
  const key = JSON.stringify(storageKey);
  const fallback = JSON.stringify(DEFAULT_THEME);
  return `(function(){try{var k=${key};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark")t=${fallback};document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme",${fallback});}})();`;
}
