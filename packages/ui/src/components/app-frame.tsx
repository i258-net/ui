import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useRender } from "@base-ui/react/use-render";

import { Button } from "./button.js";
import { PaneResizeHandle } from "./pane-resize-handle.js";
import {
  FrameHeaderRefContext,
  FramePortalContext,
  SidebarHandleContext,
  SidebarModeContext,
  type SidebarMode,
} from "../lib/frame-context.js";
import { useMediaQuery } from "../lib/use-media-query.js";
import { cn } from "../lib/utils.js";

export type { SidebarMode };

/** Below 768px the sidebar is a start-edge sheet. (Also 1440px at 200%.) */
export const FRAME_NARROW_NAV = "(max-width: 47.99rem)";
/** Below 980px the inspector is an end-edge sheet over the main pane. */
export const FRAME_NARROW_INSPECTOR = "(max-width: 61.24rem)";

/**
 * Which panes are sheets at the current width, using the frame's shared
 * breakpoints. For header controls: a menu button that opens the nav sheet
 * when `navIsSheet`, a rail toggle otherwise. Both are `false` on the server
 * and during hydration.
 */
export function useFrameLayout(): { navIsSheet: boolean; inspectorIsSheet: boolean } {
  return {
    navIsSheet: useMediaQuery(FRAME_NARROW_NAV),
    inspectorIsSheet: useMediaQuery(FRAME_NARROW_INSPECTOR),
  };
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
  /** Expanded sidebar width in px. Uncontrolled when omitted. */
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
   */
  navSheetOpen?: boolean | undefined;
  onNavSheetOpenChange?: ((open: boolean) => void) | undefined;
  /** Accessible name of the navigation sheet. */
  navSheetLabel?: string | undefined;
  closeNavSheetLabel?: string | undefined;

  /** Usually a `<FrameHeader>`; sticky at the top of the main pane. */
  header?: React.ReactNode | undefined;
  children?: React.ReactNode | undefined;
  /** Id of the `<main>`; the skip link targets it. Generated when omitted. */
  mainId?: string | undefined;
  skipLinkLabel?: string | undefined;

  /**
   * Usually an `<Inspector>`; shown while `inspectorOpen` — as an end pane,
   * or below 980px as a modal end sheet over the main pane.
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
 * whatever opened them. The app owns the content and routing.
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

  const { navIsSheet, inspectorIsSheet } = useFrameLayout();
  const sidebarWanted = sidebar != null && sidebarMode !== "hidden";
  const hasSidebar = sidebarWanted && !navIsSheet;
  const navSheet = sidebarWanted && navIsSheet;
  const inspectorWanted = inspector != null && inspectorOpen;
  const showInspector = inspectorWanted && !inspectorIsSheet;
  const inspectorSheet = inspector != null && inspectorIsSheet;

  // Widened past the breakpoint with the sheet open: the sheet is gone, so
  // say so — otherwise it would reopen on the next narrowing.
  const navSheetStale = navSheetOpen && !navIsSheet;
  React.useEffect(() => {
    if (navSheetStale) onNavSheetOpenChange?.(false);
  }, [navSheetStale, onNavSheetOpenChange]);

  const sidebarRef = React.useRef<HTMLDivElement>(null);
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
  const lastFocus = React.useRef<{ el: HTMLElement; region: Region } | null>(null);
  const lastOutsideInspector = React.useRef<HTMLElement | null>(null);

  const onFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const region: Region = el.closest("[data-frame-pane='sidebar']")
      ? "sidebar"
      : el.closest("[data-frame-pane='inspector']")
        ? "inspector"
        : "other";
    lastFocus.current = { el, region };
    if (region !== "inspector") lastOutsideInspector.current = el;
  };

  React.useLayoutEffect(() => {
    const last = lastFocus.current;
    if (!last || last.region === "other") return;
    const active = document.activeElement;
    if (visible(last.el)) return;
    // Focus already went somewhere on purpose (e.g. the app moved it).
    if (active && active !== document.body && active !== last.el) return;

    const main = document.getElementById(mainId);
    let target: HTMLElement | null = null;
    if (last.region === "sidebar") {
      const pane = sidebarRef.current;
      if (pane && visible(pane)) {
        const current = pane.querySelector<HTMLElement>("[aria-current]");
        target =
          (current && visible(current) ? current : null) ??
          [...pane.querySelectorAll<HTMLElement>(FOCUSABLE)].find(visible) ??
          null;
      }
    } else {
      const back = lastOutsideInspector.current;
      if (back && visible(back)) target = back;
    }
    (target ?? main)?.focus();
  }, [sidebarMode, hasSidebar, showInspector, inspectorWanted, mainId]);

  const sidebarHandle =
    sidebarMode === "expanded" && sidebarResizable ? (
      <PaneResizeHandle
        label="Resize sidebar"
        edge="end"
        value={sidebarWidth}
        min={sidebarMinWidth}
        max={sidebarMaxWidth}
        onValueChange={setSidebarWidth}
        onActivate={onSidebarHandleActivate}
        controls={sidebarId}
      />
    ) : null;

  return (
    <div
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
              : `${sidebarWidth}px`,
          "--i258-frame-inspector": showInspector ? `${inspectorWidth}px` : "0px",
          ...style,
        } as React.CSSProperties
      }
      {...props}
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
            open={navSheetOpen}
            onOpenChange={(open) => onNavSheetOpenChange?.(open)}
          >
            <Dialog.Portal container={portal}>
              <Dialog.Backdrop className="i258-frame__backdrop" />
              <Dialog.Popup
                className="i258-frame__sheet"
                data-placement="start"
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
            open={inspectorOpen}
            onOpenChange={(open) => onInspectorOpenChange?.(open)}
          >
            <Dialog.Portal container={portal}>
              <Dialog.Backdrop className="i258-frame__backdrop" />
              <Dialog.Popup
                className="i258-frame__sheet"
                data-placement="end"
                data-frame-pane="inspector"
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
                value={inspectorWidth}
                min={inspectorMinWidth}
                max={inspectorMaxWidth}
                onValueChange={setInspectorWidth}
                controls={inspectorId}
              />
            ) : null}
            {inspector}
          </aside>
        ) : null}
      </FramePortalContext.Provider>

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
  const setRef = React.useCallback(
    (el: HTMLElement | null) => {
      register?.(el);
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [register, ref],
  );
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
