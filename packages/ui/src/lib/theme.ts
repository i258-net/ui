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

/** The element whose `data-theme` a control inside `node` reads and sets. */
export function themeHostOf(node: Element): HTMLElement {
  return node.closest<HTMLElement>("[data-theme]") ?? document.documentElement;
}

/**
 * The theme in force at `node`, read from the same custom property the
 * stylesheet branches on — so an unthemed page following the OS reads true.
 *
 * Read as a number rather than matched against `"1"`: the CSS is arithmetic on
 * this token, so a consumer theme block writing `1.0` must not render dark and
 * report light. An empty string (stylesheet absent) is `0`, i.e. light.
 *
 * Client-only — needs a live element and its computed style.
 */
export function readAppliedTheme(node: Element): Theme {
  const isDark = getComputedStyle(node)
    .getPropertyValue("--i258-theme-is-dark")
    .trim();
  return Number(isDark) > 0 ? "dark" : "light";
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
 * Sync `data-theme` with a change made in another tab.
 *
 * The `storage` event only fires in *other* documents on the same origin, so
 * this never re-enters for the tab that made the change. A `null` `key` means
 * `localStorage.clear()`; treat that as a reset to {@link DEFAULT_THEME}.
 *
 * Returns an unsubscribe function; no-op on the server.
 */
export function subscribeToTheme(
  onChange: (theme: Theme) => void,
  storageKey: string = THEME_STORAGE_KEY,
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key !== null && event.key !== storageKey) return;
    onChange(resolveTheme(event.key === null ? null : event.newValue));
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
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
