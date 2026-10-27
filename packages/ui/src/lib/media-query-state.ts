import * as React from "react";

/**
 * The live value of a media query, or `null` until it has really been
 * measured (on the server and during hydration). Private: AppFrame uses it
 * to tell a genuine viewport change from the hydration fallback.
 */
export function useMediaQueryState(query: string): boolean | null {
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
      typeof window === "undefined" || !window.matchMedia ? null : window.matchMedia(query).matches,
    () => null,
  );
}
