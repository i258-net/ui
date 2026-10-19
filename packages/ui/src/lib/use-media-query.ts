import * as React from "react";

/**
 * Subscribe to a CSS media query.
 *
 * Returns `fallback` on the server and during hydration, so server and
 * client markup match; the real value lands in the commit after hydration.
 * The `change` listener is removed when the component unmounts or the query
 * changes. The kit's frame sets no breakpoints itself — apps pick their own
 * and pass the result to AppFrame as `sidebarMode` / `inspectorOpen`.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () =>
      typeof window === "undefined" || !window.matchMedia
        ? fallback
        : window.matchMedia(query).matches,
    () => fallback,
  );
}
