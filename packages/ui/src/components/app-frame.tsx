import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useRender } from "@base-ui/react/use-render";

import { Button } from "./button.js";
import { PaneResizeHandle } from "./pane-resize-handle.js";
import { useComposedRefs } from "../lib/compose-refs.js";
import { fitPanes, inspectorFits } from "../lib/frame-fit.js";
import {
  FrameHeaderRefContext,
  FrameLayoutContext,
  FramePortalContext,
  SidebarHandleContext,
  SidebarModeContext,
  type SidebarMode,
} from "../lib/frame-context.js";
import { useMediaQueryState } from "../lib/media-query-state.js";
import { cn } from "../lib/utils.js";

export type { SidebarMode };

/** Below 768px the sidebar is a start-edge sheet. (Also 1440px at 200%.) */
export const FRAME_NARROW_NAV = "(max-width: 47.99rem)";
/** Below 980px the inspector is an end-edge sheet over the main pane. */
export const FRAME_NARROW_INSPECTOR = "(max-width: 61.24rem)";

/**
 * Which panes are sheets. For header controls: a menu button that opens the
 * nav sheet when `navIsSheet`, a rail toggle otherwise. Both are `false` on
 * the server and during hydration.
 *
 * Inside an AppFrame (in its header, sidebar, main or inspector) this is the
 * frame's own layout, including an inspector shown as a sheet because the
 * frame is too narrow for it. Outside one it is the shared viewport
 * breakpoints. The two agree on `navIsSheet` always, and on
 * `inspectorIsSheet` whenever the frame fills the viewport.
 */
export function useFrameLayout(): { navIsSheet: boolean; inspectorIsSheet: boolean } {
  const frame = React.useContext(FrameLayoutContext);
  const navIsSheet = useMediaQueryState(FRAME_NARROW_NAV) ?? false;
  const inspectorIsSheet = useMediaQueryState(FRAME_NARROW_INSPECTOR) ?? false;
  return frame ?? { navIsSheet, inspectorIsSheet };
}

type Sheet = "nav" | "inspector";
type SheetAsks = { nav: boolean; inspector: boolean; owner: Sheet | null };

/**
 * One modal sheet at a time. Two sibling modal dialogs would each hide the
 * other from assistive tech and fight over focus, so when both are asked
 * for, the one asked for most recently owns the screen; if both arrive in
 * the same render (a deep link, a hydrated narrow page) the inspector does.
 */
function nextSheetAsks(prev: SheetAsks, nav: boolean, inspector: boolean): SheetAsks {
  let owner: Sheet | null = nav ? "nav" : inspector ? "inspector" : null;
  if (nav && inspector) {
    const navNew = !prev.nav;
    const inspectorNew = !prev.inspector;
    owner = navNew && !inspectorNew ? "nav" : inspectorNew && !navNew ? "inspector" : (prev.owner ?? "inspector");
  }
  return { nav, inspector, owner };
}

export type AppFrameProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Usually a `<Sidebar>`. */
  sidebar?: React.ReactNode | undefined;
  /**
   * Wide screens: `expanded` (resizable), `rail` (icons only) or `hidden`
   * (no sidebar, and no nav sheet). Below 768px an expanded or rail sidebar
   * is a sheet instead, opened with `navSheetOpen`.
   */
  sidebarMode?: SidebarMode | undefined;
  /**
   * Expanded sidebar width in px. Uncontrolled when omitted. The width drawn
   * (and announced by the handle) is fitted to the frame — see
   * `mainMinWidth` — without rewriting this value.
   */
  sidebarWidth?: number | undefined;
  defaultSidebarWidth?: number | undefined;
  onSidebarWidthChange?: ((width: number) => void) | undefined;
  sidebarMinWidth?: number | undefined;
  sidebarMaxWidth?: number | undefined;
  /** Set `false` to drop the sidebar's resize handle. */
  sidebarResizable?: boolean | undefined;
  /** Enter on / double-click the sidebar handle (reset, or collapse). */
  onSidebarHandleActivate?: (() => void) | undefined;
  /**
   * Below 768px: whether the navigation sheet is open. The app owns the
   * button that opens it (see `useFrameLayout`) and closes it on navigation;
   * the frame closes it on Escape, the backdrop, its close button, and when
   * the window widens past the breakpoint.
   *
   * Only one sheet is shown at a time. Opening the nav sheet while the
   * inspector sheet is open (or the reverse) shows the newer one and calls
   * the other's `on…OpenChange(false)`; if both open together the inspector
   * wins. A sheet the app keeps open anyway shows again once the other
   * closes.
   */
  navSheetOpen?: boolean | undefined;
  onNavSheetOpenChange?: ((open: boolean) => void) | undefined;
  /** Accessible name of the navigation sheet. */
  navSheetLabel?: string | undefined;
  closeNavSheetLabel?: string | undefined;

  /** Usually a `<FrameHeader>`; sticky at the top of the main pane. */
  header?: React.ReactNode | undefined;
  children?: React.ReactNode | undefined;
  /**
   * The main pane's minimum width in px (default 320). Pane widths are fitted
   * so the main pane keeps it, as far as the panes' own minimum widths allow:
   * those are floors.
   *
   * A frame narrower than its minima (embedded in a narrow container on a
   * wide screen) first shows the inspector as a sheet, as below 980px. If
   * the sidebar and main pane still do not fit, they share the frame in
   * proportion to their minima, below both, rather than push anything past
   * the frame's edge. The nav sheet follows the viewport only, because the
   * app owns the button that opens it (see `useFrameLayout`).
   */
  mainMinWidth?: number | undefined;
  /** Id of the `<main>`; the skip link targets it. Generated when omitted. */
  mainId?: string | undefined;
  skipLinkLabel?: string | undefined;

  /**
   * Usually an `<Inspector>`; shown while `inspectorOpen` — as an end pane,
   * or as a modal end sheet over the main pane below 980px or when the frame
   * is too narrow for it (see `mainMinWidth`).
   */
  inspector?: React.ReactNode | undefined;
  inspectorOpen?: boolean | undefined;
  /** The sheet asks to close (Escape, backdrop). Required for the sheet. */
  onInspectorOpenChange?: ((open: boolean) => void) | undefined;
  /** Accessible name of the inspector `aside` / sheet. */
  inspectorLabel?: string | undefined;
  inspectorWidth?: number | undefined;
  defaultInspectorWidth?: number | undefined;
  onInspectorWidthChange?: ((width: number) => void) | undefined;
  inspectorMinWidth?: number | undefined;
  inspectorMaxWidth?: number | undefined;
  inspectorResizable?: boolean | undefined;

  /**
   * Density token switch: sets `data-density` on the frame (and so on
   * everything it portals). Omit to inherit from an ancestor.
   */
  density?: "comfortable" | "compact" | undefined;
};

function useControlled(
  value: number | undefined,
  fallback: number,
  onChange: ((v: number) => void) | undefined,
): [number, (v: number) => void] {
  const [inner, setInner] = React.useState(fallback);
  const current = value ?? inner;
  const set = React.useCallback(
    (v: number) => {
      if (value === undefined) setInner(v);
      onChange?.(v);
    },
    [value, onChange],
  );
  return [current, set];
}

const visible = (el: Element) => el.isConnected && el.getClientRects().length > 0;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Region = "sidebar" | "inspector" | "other";

/**
 * The application frame:
 *
 *   [ sidebar | header / main | inspector ]
 *
 * Each pane scrolls on its own. The sidebar resizes and can be drawn as a
 * rail or hidden; the inspector is an optional resizable end pane.
 * Landmarks: the sidebar is an `aside` holding the primary `nav`, the
 * header is the banner, the main pane is `main` (target of the skip link),
 * the inspector is a labelled `aside`.
 *
 * Narrow screens (shared defaults): below 768px the sidebar is a modal
 * start sheet, below 980px the inspector a modal end sheet. The sheets are
 * Base UI dialogs, which trap focus, make the rest inert and return focus to
 * whatever opened them. The app owns the content and routing. A frame too
 * narrow for its panes' minimum widths also shows the inspector as a sheet
 * (see `mainMinWidth`).
 *
 * Inline panes: focus is never dropped by the frame's own changes. If the
 * focused element disappears because the sidebar collapses, hides or turns
 * into a sheet, or the inspector closes, focus moves to the current sidebar
 * item / the element that had focus before the inspector / the main pane.
 */
export function AppFrame({
  sidebar,
  sidebarMode = "expanded",
  sidebarWidth: sidebarWidthProp,
  defaultSidebarWidth = 240,
  onSidebarWidthChange,
  sidebarMinWidth = 200,
  sidebarMaxWidth = 400,
  sidebarResizable = true,
  onSidebarHandleActivate,
  navSheetOpen = false,
  onNavSheetOpenChange,
  navSheetLabel = "Navigation",
  closeNavSheetLabel = "Close navigation",
  header,
  children,
  mainMinWidth = 320,
  mainId: mainIdProp,
  skipLinkLabel = "Skip to main content",
  inspector,
  inspectorOpen = false,
  onInspectorOpenChange,
  inspectorLabel = "Inspector",
  inspectorWidth: inspectorWidthProp,
  defaultInspectorWidth = 400,
  onInspectorWidthChange,
  inspectorMinWidth = 320,
  inspectorMaxWidth = 720,
  inspectorResizable = true,
  density,
  className,
  style,
  ref,
  onFocusCapture: onFocusCaptureProp,
  ...props
}: AppFrameProps) {
  const generatedId = React.useId();
  const mainId = mainIdProp ?? `i258-main${generatedId.replace(/:/g, "")}`;
  const sidebarId = React.useId();
  const inspectorId = React.useId();

  const [sidebarWidth, setSidebarWidth] = useControlled(
    sidebarWidthProp,
    defaultSidebarWidth,
    onSidebarWidthChange,
  );
  const [inspectorWidth, setInspectorWidth] = useControlled(
    inspectorWidthProp,
    defaultInspectorWidth,
    onInspectorWidthChange,
  );

  // `null` until measured: the server and hydration render the wide layout.
  const navQuery = useMediaQueryState(FRAME_NARROW_NAV);
  const inspectorQuery = useMediaQueryState(FRAME_NARROW_INSPECTOR);
  const navIsSheet = navQuery === true;
  const sidebarWanted = sidebar != null && sidebarMode !== "hidden";
  const hasSidebar = sidebarWanted && !navIsSheet;
  const navSheet = sidebarWanted && navIsSheet;
  const isRail = hasSidebar && sidebarMode === "rail";

  // —— the frame's own width ——
  // The consumer's ref is composed with ours, never in place of it.
  const frameRef = React.useRef<HTMLDivElement>(null);
  const setFrameRef = useComposedRefs(frameRef, ref);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = React.useState<number | null>(null);
  const [railWidth, setRailWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const sync = () => {
      // 0 while hidden (display: none, a closed tab): keep the last width
      // rather than treat the frame as too narrow for anything.
      if (frame.clientWidth > 0) setFrameWidth(frame.clientWidth);
      const pane = sidebarRef.current;
      setRailWidth(pane ? pane.getBoundingClientRect().width : 0);
    };
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(sync);
    ro.observe(frame);
    if (isRail && sidebarRef.current) ro.observe(sidebarRef.current);
    return () => ro.disconnect();
  }, [isRail]);

  // Below 980px, or in a frame too narrow for the inspector beside the
  // sidebar and main pane at their minimum widths, the inspector is a sheet.
  const inspectorIsSheet =
    inspectorQuery === true ||
    !inspectorFits({
      frame: frameWidth,
      sidebarFloor: !hasSidebar ? 0 : isRail ? railWidth : sidebarMinWidth,
      mainMin: mainMinWidth,
      inspectorMin: inspectorMinWidth,
    });
  const inspectorWanted = inspector != null && inspectorOpen;
  const showInspector = inspectorWanted && !inspectorIsSheet;
  const inspectorSheet = inspector != null && inspectorIsSheet;
  const layout = React.useMemo(
    () => ({ navIsSheet, inspectorIsSheet }),
    [navIsSheet, inspectorIsSheet],
  );

  // —— sheet ownership ——
  const navAsk = navSheet && navSheetOpen;
  const inspectorAsk = inspectorSheet && inspectorWanted;
  const [asks, setAsks] = React.useState<SheetAsks>(() =>
    nextSheetAsks({ nav: false, inspector: false, owner: null }, navAsk, inspectorAsk),
  );
  let sheetOwner = asks.owner;
  if (asks.nav !== navAsk || asks.inspector !== inspectorAsk) {
    const next = nextSheetAsks(asks, navAsk, inspectorAsk);
    sheetOwner = next.owner;
    setAsks(next);
  }
  const navShown = navAsk && sheetOwner === "nav";
  const inspectorShown = inspectorAsk && sheetOwner === "inspector";
  const sheetOwnerRef = React.useRef(sheetOwner);
  React.useLayoutEffect(() => {
    sheetOwnerRef.current = sheetOwner;
  }, [sheetOwner]);

  // The displaced sheet is told it closed, so app state matches the screen.
  const navDisplaced = navAsk && !navShown;
  const inspectorDisplaced = inspectorAsk && !inspectorShown;
  React.useEffect(() => {
    if (navDisplaced) onNavSheetOpenChange?.(false);
  }, [navDisplaced, onNavSheetOpenChange]);
  React.useEffect(() => {
    if (inspectorDisplaced) onInspectorOpenChange?.(false);
  }, [inspectorDisplaced, onInspectorOpenChange]);

  // Widened past the breakpoint with the sheet open: the sheet is gone, so
  // say so — otherwise it would reopen on the next narrowing. Only on a real
  // narrow → wide change: not for the wide fallback before the viewport is
  // measured, which would close a sheet a narrow page hydrated open.
  const prevNavQuery = React.useRef(navQuery);
  React.useEffect(() => {
    const was = prevNavQuery.current;
    prevNavQuery.current = navQuery;
    if (was === true && navQuery === false && navSheetOpen) onNavSheetOpenChange?.(false);
  }, [navQuery, navSheetOpen, onNavSheetOpenChange]);

  // Nav sheet open, then the sidebar goes away (no `sidebar`, or `hidden`)
  // at the same width: the sheet is gone too, so say so — otherwise it
  // would reopen when the sidebar comes back.
  const prevNavSheet = React.useRef(navSheet);
  React.useEffect(() => {
    const was = prevNavSheet.current;
    prevNavSheet.current = navSheet;
    if (was && !navSheet && navIsSheet && navSheetOpen) onNavSheetOpenChange?.(false);
  }, [navSheet, navIsSheet, navSheetOpen, onNavSheetOpenChange]);

  // —— pane widths fitted to the frame ——
  const fitted = fitPanes({
    frame: frameWidth,
    mainMin: mainMinWidth,
    sidebar: hasSidebar && sidebarMode === "expanded" ? sidebarWidth : null,
    sidebarMin: sidebarMinWidth,
    sidebarMax: sidebarMaxWidth,
    sidebarFixed: isRail ? railWidth : null,
    inspector: showInspector ? inspectorWidth : null,
    inspectorMin: inspectorMinWidth,
    inspectorMax: inspectorMaxWidth,
  });
  const drawnSidebarWidth = fitted.sidebar ?? sidebarWidth;
  const drawnInspectorWidth = fitted.inspector ?? inspectorWidth;

  const mainPaneRef = React.useRef<HTMLDivElement>(null);
  const [portal, setPortal] = React.useState<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  // The sticky header's real height (it wraps at 320px / 200% zoom) feeds
  // the main pane's scroll-padding-top, so whatever is scrolled into view —
  // Tab and Shift+Tab, find-in-page, fragment links — lands below the header
  // and its fade, never behind them (WCAG 2.4.11).
  const [headerEl, setHeaderEl] = React.useState<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    const pane = mainPaneRef.current;
    if (!pane) return;
    if (!headerEl) {
      pane.style.removeProperty("--i258-frame-header-h");
      return;
    }
    const sync = () =>
      pane.style.setProperty(
        "--i258-frame-header-h",
        `${Math.ceil(headerEl.getBoundingClientRect().height)}px`,
      );
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(sync);
    ro.observe(headerEl);
    return () => ro.disconnect();
  }, [headerEl]);

  // —— focus continuity ——
  const lastFocus = React.useRef<{ el: HTMLElement; region: Region; inSheet: boolean } | null>(
    null,
  );
  const lastOutsideInspector = React.useRef<HTMLElement | null>(null);
  const lastOutsideSheets = React.useRef<HTMLElement | null>(null);

  const onFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    onFocusCaptureProp?.(e);
    const el = e.target as HTMLElement;
    // Noted now: once a sheet unmounts, its elements have no ancestors.
    const inSheet = el.closest(".i258-frame__layer") != null;
    if (!inSheet) lastOutsideSheets.current = el;
    const region: Region = el.closest("[data-frame-pane='sidebar']")
      ? "sidebar"
      : el.closest("[data-frame-pane='inspector']")
        ? "inspector"
        : "other";
    lastFocus.current = { el, region, inSheet };
    if (region !== "inspector") lastOutsideInspector.current = el;
  };

  React.useLayoutEffect(() => {
    const last = lastFocus.current;
    if (!last || (last.region === "other" && !last.inSheet)) return;
    const active = document.activeElement;
    if (visible(last.el)) return;
    // Focus already went somewhere on purpose (e.g. the app moved it).
    if (active && active !== document.body && active !== last.el) return;
    // A sheet on screen (say the inspector, once the nav sheet it was
    // waiting behind is gone) places focus itself.
    if (sheetOwner) return;

    const main = document.getElementById(mainId);
    let target: HTMLElement | null = null;
    const pane = sidebarRef.current;
    if (last.region === "sidebar" && pane && visible(pane)) {
      // Into the inline sidebar, from it or from the nav sheet it replaced.
      const current = pane.querySelector<HTMLElement>("[aria-current]");
      target =
        (current && visible(current) ? current : null) ??
        [...pane.querySelectorAll<HTMLElement>(FOCUSABLE)].find(visible) ??
        null;
    } else if (last.inSheet) {
      // A sheet that vanished without closing — the app dropped its content
      // (`sidebar` or `inspector` gone, or the sidebar hidden) — so it did
      // not return focus: back to what had focus before any sheet, not to
      // something inside another sheet.
      const back = lastOutsideSheets.current;
      if (back && visible(back) && !back.closest("[inert]")) target = back;
    } else if (last.region === "inspector") {
      const back = lastOutsideInspector.current;
      if (back && visible(back)) target = back;
    }
    (target ?? main)?.focus();
  }, [
    sidebarMode,
    hasSidebar,
    navSheet,
    showInspector,
    inspectorSheet,
    inspectorWanted,
    sheetOwner,
    mainId,
  ]);

  // A closing sheet returns focus to what had it before (the default), or
  // to the main pane if that is gone — but not when the other sheet has just
  // taken over: that one places focus itself.
  const sheetFinalFocus = React.useCallback((): boolean | HTMLElement | null => {
    if (sheetOwnerRef.current) return false;
    const back = lastOutsideSheets.current;
    if (back && visible(back) && !back.closest("[inert]")) return back;
    return document.getElementById(mainId);
  }, [mainId]);

  const sidebarHandle =
    sidebarMode === "expanded" && sidebarResizable ? (
      <PaneResizeHandle
        label="Resize sidebar"
        edge="end"
        value={drawnSidebarWidth}
        min={fitted.sidebarMin}
        max={fitted.sidebarMax}
        onValueChange={setSidebarWidth}
        onActivate={onSidebarHandleActivate}
        controls={sidebarId}
      />
    ) : null;

  return (
    <div
      {...props}
      ref={setFrameRef}
      data-slot="app-frame"
      className={cn("i258-frame", className)}
      data-density={density}
      data-sidebar={hasSidebar ? sidebarMode : navSheet ? "sheet" : "hidden"}
      data-inspector={showInspector ? "open" : undefined}
      onFocusCapture={onFocusCapture}
      style={
        {
          "--i258-frame-sidebar": !hasSidebar
            ? "0px"
            : sidebarMode === "rail"
              ? "var(--i258-sidebar-rail)"
              : `${drawnSidebarWidth}px`,
          "--i258-frame-inspector": showInspector ? `${drawnInspectorWidth}px` : "0px",
          ...style,
        } as React.CSSProperties
      }
    >
      <a
        className="i258-skip-link"
        href={`#${mainId}`}
        onClick={(e) => {
          // Hash routers own the fragment; move focus without navigating.
          e.preventDefault();
          document.getElementById(mainId)?.focus();
        }}
      >
        {skipLinkLabel}
      </a>

      <FrameLayoutContext.Provider value={layout}>
      <FramePortalContext.Provider value={portal}>
        {hasSidebar ? (
          <div
            ref={sidebarRef}
            id={sidebarId}
            tabIndex={-1}
            className="i258-frame__sidebar"
            data-frame-pane="sidebar"
          >
            <SidebarModeContext.Provider value={sidebarMode}>
              <SidebarHandleContext.Provider value={sidebarHandle}>
                {sidebar}
              </SidebarHandleContext.Provider>
            </SidebarModeContext.Provider>
          </div>
        ) : null}

        <div
          ref={mainPaneRef}
          className="i258-frame__main"
          data-scrolled={scrolled ? "" : undefined}
          onScroll={(e) => {
            const next = e.currentTarget.scrollTop > 0;
            if (next !== scrolled) setScrolled(next);
          }}
        >
          <FrameHeaderRefContext.Provider value={setHeaderEl}>
            {header}
          </FrameHeaderRefContext.Provider>
          <main id={mainId} tabIndex={-1} className="i258-frame__content">
            {children}
          </main>
        </div>

        {navSheet ? (
          <Dialog.Root
            open={navShown}
            onOpenChange={(open) => onNavSheetOpenChange?.(open)}
          >
            <Dialog.Portal container={portal}>
              <Dialog.Backdrop className="i258-frame__backdrop" />
              <Dialog.Popup
                className="i258-frame__sheet"
                data-placement="start"
                finalFocus={sheetFinalFocus}
                data-frame-pane="sidebar"
              >
                <Dialog.Title className="i258-sr-only">{navSheetLabel}</Dialog.Title>
                <Dialog.Close
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="i258-frame__sheet-close"
                      aria-label={closeNavSheetLabel}
                    />
                  }
                >
                  <CloseIcon />
                </Dialog.Close>
                <SidebarModeContext.Provider value="expanded">
                  {sidebar}
                </SidebarModeContext.Provider>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ) : null}

        {inspectorSheet ? (
          <Dialog.Root
            open={inspectorShown}
            onOpenChange={(open) => onInspectorOpenChange?.(open)}
          >
            <Dialog.Portal container={portal}>
              <Dialog.Backdrop className="i258-frame__backdrop" />
              <Dialog.Popup
                className="i258-frame__sheet"
                data-placement="end"
                data-frame-pane="inspector"
                finalFocus={sheetFinalFocus}
                aria-label={inspectorLabel}
              >
                {inspector}
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ) : null}

        {showInspector ? (
          <aside
            id={inspectorId}
            aria-label={inspectorLabel}
            className="i258-frame__inspector"
            data-frame-pane="inspector"
          >
            {inspectorResizable ? (
              <PaneResizeHandle
                label="Resize inspector"
                edge="start"
                value={drawnInspectorWidth}
                min={fitted.inspectorMin}
                max={fitted.inspectorMax}
                onValueChange={setInspectorWidth}
                controls={inspectorId}
              />
            ) : null}
            {inspector}
          </aside>
        ) : null}
      </FramePortalContext.Provider>
      </FrameLayoutContext.Provider>

      {/* Floating layers (sheets, rail names) portal here to inherit the
          frame's theme and density. */}
      <div ref={setPortal} className="i258-frame__layer" />
    </div>
  );
}

export type FrameBreadcrumb = {
  label: React.ReactNode;
  href?: string | undefined;
  /** Router link element, as with `Link`'s `render`. */
  render?: useRender.RenderProp | undefined;
};

export type FrameHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  /** Pane toggles before the title. */
  leading?: React.ReactNode | undefined;
  /** Ancestors of the current view; the current view is `title`. */
  breadcrumbs?: FrameBreadcrumb[] | undefined;
  /** The view's name — rendered as the page's only `h1`. */
  title: React.ReactNode;
  /** Id for the h1 so route changes can move focus to it. */
  titleId?: string | undefined;
  /** Muted facts beside the title (counts). */
  meta?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
};

function BreadcrumbLink({ label, href, render }: FrameBreadcrumb) {
  return useRender({
    defaultTagName: "a",
    render,
    props: { href, children: label },
  });
}

/**
 * Header for AppFrame's main pane: breadcrumb → h1 → meta, then actions.
 * Sticky inside the pane and wraps on narrow widths; once the pane scrolls
 * it fades its bottom edge instead of drawing a border.
 */
export function FrameHeader({
  leading,
  breadcrumbs = [],
  title,
  titleId,
  meta,
  actions,
  className,
  ref,
  ...props
}: FrameHeaderProps) {
  const register = React.useContext(FrameHeaderRefContext);
  const setRef = useComposedRefs<HTMLElement>(register ?? undefined, ref);
  return (
    <header
      ref={setRef}
      data-slot="frame-header"
      className={cn("i258-frame-header", className)}
      {...props}
    >
      {leading != null ? (
        <div className="i258-frame-header__leading">{leading}</div>
      ) : null}
      <div className="i258-frame-header__title-row">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="i258-breadcrumb">
            <ol>
              {breadcrumbs.map((b, i) => (
                <li key={i}>
                  <BreadcrumbLink {...b} />
                  <span className="i258-breadcrumb__sep" aria-hidden="true">
                    /
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 id={titleId} tabIndex={-1} className="i258-frame-header__title">
          {title}
        </h1>
        {meta != null ? <div className="i258-frame-header__meta">{meta}</div> : null}
      </div>
      {actions != null ? (
        <div className="i258-frame-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}

export type InspectorProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  /** Small line above the title (id, kind). */
  eyebrow?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  /** Shows a close button. AppFrame returns focus when the pane closes. */
  onClose?: (() => void) | undefined;
  closeLabel?: string | undefined;
};

/** Content for AppFrame's inspector pane: a header and a scrolling body. */
export function Inspector({
  title,
  eyebrow,
  actions,
  onClose,
  closeLabel = "Close inspector",
  className,
  children,
  ...props
}: InspectorProps) {
  return (
    <div
      data-slot="inspector"
      className={cn("i258-inspector", className)}
      {...props}
    >
      <div className="i258-inspector__header">
        <div className="i258-inspector__heading">
          {eyebrow != null ? (
            <div className="i258-inspector__eyebrow">{eyebrow}</div>
          ) : null}
          <h2 className="i258-inspector__title">
            {title}
          </h2>
        </div>
        {actions != null || onClose ? (
          <div className="i258-inspector__actions">
            {actions}
            {onClose ? (
              <Button
                variant="ghost"
                size="sm"
                className="i258-inspector__close"
                aria-label={closeLabel}
                onClick={onClose}
              >
                <CloseIcon />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="i258-inspector__body">{children}</div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
