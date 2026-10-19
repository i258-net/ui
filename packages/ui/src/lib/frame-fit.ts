/*
  Pane width arithmetic for AppFrame, kept pure so it can be tested without
  a browser. Private to the package.
*/

/** A minimum: finite and not negative, else 0. */
const floorOf = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
/** A maximum: at least `min` (NaN, negatives and too-small values become `min`). */
const ceilOf = (v: number, min: number) => (v >= min ? v : min);
/** A measured width: positive, else unknown. */
const measured = (v: number | null) => (v != null && Number.isFinite(v) && v > 0 ? v : null);

export type FitInput = {
  /** The frame's measured width, or `null` before it is measured. */
  frame: number | null;
  mainMin: number;
  /** Stored expanded-sidebar width, or `null` when there is no expanded sidebar. */
  sidebar: number | null;
  sidebarMin: number;
  sidebarMax: number;
  /** Rail: a fixed width the sidebar takes regardless. */
  sidebarFixed: number | null;
  /** Stored inspector width, or `null` when the inspector is not an inline pane. */
  inspector: number | null;
  inspectorMin: number;
  inspectorMax: number;
};

export type FitResult = {
  sidebar: number | null;
  sidebarMin: number;
  sidebarMax: number;
  inspector: number | null;
  inspectorMin: number;
  inspectorMax: number;
  /** The minima did not fit, so every pane was shrunk below its own. */
  squeezed: boolean;
};

/**
 * Whether an inline inspector fits beside the sidebar (at its narrowest)
 * and the main pane (at its minimum). When it does not, AppFrame shows the
 * inspector as a sheet instead. An unmeasured frame fits.
 */
export function inspectorFits(o: {
  frame: number | null;
  sidebarFloor: number;
  mainMin: number;
  inspectorMin: number;
}): boolean {
  const frame = measured(o.frame);
  if (frame == null) return true;
  return floorOf(o.sidebarFloor) + floorOf(o.mainMin) + floorOf(o.inspectorMin) <= frame;
}

/**
 * Pane widths that fit the frame. Each pane keeps its own min as a floor;
 * the main pane keeps `mainMin` whenever the minima allow it. The sidebar
 * may grow until the inspector is at its min; the inspector takes what is
 * left. Stored widths are not rewritten, so a pane squeezed by a narrow
 * frame returns to its width when the frame widens again.
 *
 * If even the minima do not fit (a frame embedded in a narrow container),
 * the resizable panes and the main pane share what is left after a rail in
 * proportion to their minima, rounded down: the panes always add up to no
 * more than the frame, so nothing is pushed out past its edge. A squeezed
 * pane's handle then reports a fixed value (min = max = now).
 */
export function fitPanes(o: FitInput): FitResult {
  const frame = measured(o.frame);
  const mainMin = floorOf(o.mainMin);
  const sMin = floorOf(o.sidebarMin);
  const sMax = ceilOf(o.sidebarMax, sMin);
  const iMin = floorOf(o.inspectorMin);
  const iMax = ceilOf(o.inspectorMax, iMin);
  const fixed = o.sidebarFixed == null ? 0 : floorOf(o.sidebarFixed);
  const hasSidebar = o.sidebar != null;
  const hasInspector = o.inspector != null;
  const fit = (v: number, min: number, max: number) =>
    Math.round(Math.max(min, Math.min(max, Number.isFinite(v) ? v : min)));

  const need = fixed + mainMin + (hasSidebar ? sMin : 0) + (hasInspector ? iMin : 0);
  if (frame != null && need > frame) {
    const shared = (hasSidebar ? sMin : 0) + mainMin + (hasInspector ? iMin : 0);
    const k = shared > 0 ? Math.max(0, frame - fixed) / shared : 0;
    const sidebar = hasSidebar ? Math.floor(sMin * k) : null;
    const inspector = hasInspector ? Math.floor(iMin * k) : null;
    return {
      sidebar,
      sidebarMin: sidebar ?? sMin,
      sidebarMax: sidebar ?? sMin,
      inspector,
      inspectorMin: inspector ?? iMin,
      inspectorMax: inspector ?? iMin,
      squeezed: true,
    };
  }

  const room = frame == null ? Infinity : frame - mainMin;
  const sidebarMax = hasSidebar
    ? Math.max(sMin, Math.min(sMax, room - (hasInspector ? iMin : 0)))
    : sMin;
  const sidebar = hasSidebar ? fit(o.sidebar!, sMin, sidebarMax) : null;
  const taken = hasSidebar ? sidebar! : fixed;
  const inspectorMax = Math.max(iMin, Math.min(iMax, room - taken));
  const inspector = hasInspector ? fit(o.inspector!, iMin, inspectorMax) : null;
  return {
    sidebar,
    sidebarMin: Math.round(sMin),
    sidebarMax: Math.round(sidebarMax),
    inspector,
    inspectorMin: Math.round(iMin),
    inspectorMax: Math.round(inspectorMax),
    squeezed: false,
  };
}
