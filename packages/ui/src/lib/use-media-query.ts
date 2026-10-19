import { useMediaQueryState } from "./media-query-state.js";

/**
 * Subscribe to a CSS media query.
 *
 * Returns `fallback` on the server and during hydration, so server and
 * client markup match; the real value lands in the commit after hydration.
 * The `change` listener is removed when the component unmounts or the query
 * changes. For AppFrame's own responsive layout, don't re-derive it here:
 * the frame decides when its panes become sheets, and `useFrameLayout`
 * reports that (`navIsSheet` / `inspectorIsSheet`). `inspectorOpen` is the
 * app's content state, not a breakpoint.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useMediaQueryState(query) ?? fallback;
}
