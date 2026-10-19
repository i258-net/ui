import { useMediaQueryState } from "./media-query-state.js";

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
  return useMediaQueryState(query) ?? fallback;
}
