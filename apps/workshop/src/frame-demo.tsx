import {
  AppFrame,
  type AppFrameProps,
  Button,
  FrameHeader,
  Inspector,
  type SidebarMode,
  useFrameLayout,
  useShortcut,
} from "@i258/ui";
import * as React from "react";

import { DemoSidebar, icons, LongContent, ROWS } from "./frame-fixtures";

export type FrameDemoProps = {
  initialMode?: SidebarMode;
  initialInspector?: string | null;
  density?: AppFrameProps["density"];
  long?: boolean;
  /** Extra header actions, to make the header wrap on narrow widths. */
  manyActions?: boolean;
  initialNavOpen?: boolean;
  /** Pane widths held in app state (controlled), shown in the content. */
  controlledWidths?: { sidebar: number; inspector: number };
  dir?: "ltr" | "rtl";
  /**
   * A sidebar footer button that opens a record without closing the nav
   * sheet, and `window.__frameDemo` for tests to drive app state while a
   * modal sheet makes the page inert.
   */
  testHooks?: boolean;
  /**
   * Pass the app's own ref to AppFrame, as an object or a callback ref (with
   * a React 19 cleanup). What it saw is in `window.__frameDemo.refLog`.
   */
  consumerRef?: "object" | "callback";
  /** Escape closes the inline inspector, as an app's `useShortcut` would. */
  escapeClosesInspector?: boolean;
};

type FrameDemoHooks = {
  setNavOpen: (open: boolean) => void;
  setSelected: (id: string | null) => void;
  /** Drop the `sidebar` prop entirely (as an app with no nav on a route). */
  setSidebarPresent: (present: boolean) => void;
  setMode: (mode: SidebarMode) => void;
  /** Keep the record selected when the frame reports the inspector closed. */
  setKeepInspector: (keep: boolean) => void;
  /** What the consumer ref saw: `attach:<width>`, `detach`. */
  refLog: string[];
  /** Every `on…OpenChange` / `on…WidthChange` call the frame made. */
  calls: string[];
};

declare global {
  interface Window {
    __frameDemo?: FrameDemoHooks;
  }
}

/**
 * A complete frame as an app would wire it: the header's leading button is a
 * rail toggle on wide screens and opens the navigation sheet below 768px.
 * State, routing and content belong to the app; the frame owns layout,
 * sheets, landmarks and focus continuity.
 */
export function FrameDemo({
  initialMode = "expanded",
  initialInspector = null,
  density,
  long = false,
  manyActions = false,
  initialNavOpen = false,
  controlledWidths,
  dir,
  testHooks = false,
  consumerRef,
  escapeClosesInspector = false,
}: FrameDemoProps) {
  const { navIsSheet } = useFrameLayout();
  const [mode, setMode] = React.useState<SidebarMode>(initialMode);
  const [navOpen, setNavOpen] = React.useState(initialNavOpen);
  const [selected, setSelected] = React.useState<string | null>(initialInspector);
  const [widths, setWidths] = React.useState(controlledWidths);
  const [sidebarPresent, setSidebarPresent] = React.useState(true);
  const row = ROWS.find((r) => r.id === selected);
  useShortcut("Escape", () => setSelected(null), {
    enabled: escapeClosesInspector && row != null,
  });

  const calls = React.useRef<string[]>([]);
  const refLog = React.useRef<string[]>([]);
  const keepInspector = React.useRef(false);
  const objectRef = React.useRef<HTMLDivElement>(null);
  const callbackRef = React.useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    refLog.current.push(`attach:${el.clientWidth}`);
    return () => {
      refLog.current.push("detach");
    };
  }, []);
  React.useLayoutEffect(() => {
    if (consumerRef === "object" && objectRef.current) {
      refLog.current.push(`attach:${objectRef.current.clientWidth}`);
    }
  }, [consumerRef]);
  React.useEffect(() => {
    if (!testHooks) return;
    window.__frameDemo = {
      setNavOpen,
      setSelected,
      setSidebarPresent,
      setMode,
      setKeepInspector: (keep) => {
        keepInspector.current = keep;
      },
      calls: calls.current,
      refLog: refLog.current,
    };
    return () => {
      delete window.__frameDemo;
    };
  }, [testHooks]);
  const log = (call: string) => {
    if (testHooks) calls.current.push(call);
  };

  const leading = navIsSheet ? (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Open navigation"
      aria-haspopup="dialog"
      onClick={() => setNavOpen(true)}
    >
      {icons.panel}
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      aria-label={mode === "rail" ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={mode !== "rail"}
      onClick={() => setMode((m) => (m === "rail" ? "expanded" : "rail"))}
      data-testid="rail-toggle"
    >
      {icons.panel}
    </Button>
  );

  return (
    <AppFrame
      ref={
        consumerRef === "object" ? objectRef : consumerRef === "callback" ? callbackRef : undefined
      }
      dir={dir}
      data-demo-nav-open={navOpen ? "" : undefined}
      data-demo-selected={selected ?? undefined}
      sidebar={
        sidebarPresent ? (
          <DemoSidebar
            footer={
              testHooks ? (
                <Button variant="secondary" size="sm" onClick={() => setSelected("item-5")}>
                  Open latest record
                </Button>
              ) : null
            }
          />
        ) : null
      }
      sidebarMode={mode}
      onSidebarHandleActivate={() => setMode("rail")}
      navSheetOpen={navOpen}
      onNavSheetOpenChange={(open) => {
        log(`nav:${open}`);
        setNavOpen(open);
      }}
      {...(widths
        ? {
            sidebarWidth: widths.sidebar,
            inspectorWidth: widths.inspector,
            onSidebarWidthChange: (w: number) => {
              log(`sidebar-width:${w}`);
              setWidths((v) => v && { ...v, sidebar: w });
            },
            onInspectorWidthChange: (w: number) => {
              log(`inspector-width:${w}`);
              setWidths((v) => v && { ...v, inspector: w });
            },
          }
        : {})}
      density={density}
      header={
        <FrameHeader
          leading={leading}
          breadcrumbs={[{ label: "Workspace", href: "#workspace" }]}
          title="Inbox"
          meta={`${ROWS.length} items`}
          actions={
            <>
              {manyActions ? (
                <>
                  <Button variant="secondary" size="sm">
                    Filter
                  </Button>
                  <Button variant="secondary" size="sm">
                    Sort
                  </Button>
                  <Button variant="secondary" size="sm">
                    Export
                  </Button>
                </>
              ) : null}
              <Button size="sm">New item</Button>
            </>
          }
        />
      }
      inspector={
        row ? (
          <Inspector eyebrow={row.id} title={row.title} onClose={() => setSelected(null)}>
            <p style={{ margin: 0 }}>
              Details for {row.title}. Synthetic content for the frame demo.
            </p>
          </Inspector>
        ) : null
      }
      inspectorOpen={row != null}
      onInspectorOpenChange={(open) => {
        log(`inspector:${open}`);
        if (!open && !keepInspector.current) setSelected(null);
      }}
      inspectorLabel="Item details"
    >
      {testHooks ? <LayoutProbe /> : null}
      {widths ? (
        <p data-testid="stored-widths" style={{ marginTop: 0 }}>
          Stored widths: sidebar {widths.sidebar}, inspector {widths.inspector}
        </p>
      ) : null}
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "grid",
          gap: 4,
        }}
      >
        {ROWS.map((r) => (
          <li key={r.id}>
            <Button
              variant="ghost"
              size="md"
              aria-pressed={selected === r.id}
              onClick={() => setSelected(r.id)}
            >
              Open {r.title}
            </Button>
          </li>
        ))}
      </ul>
      {long ? (
        <div style={{ marginTop: 16 }}>
          <LongContent />
        </div>
      ) : null}
    </AppFrame>
  );
}

/** What `useFrameLayout` reports from inside the frame. */
function LayoutProbe() {
  const { navIsSheet, inspectorIsSheet } = useFrameLayout();
  return (
    <p
      data-testid="frame-layout"
      data-nav-sheet={String(navIsSheet)}
      data-inspector-sheet={String(inspectorIsSheet)}
      style={{ marginTop: 0 }}
    >
      Layout: nav {navIsSheet ? "sheet" : "inline"}, inspector{" "}
      {inspectorIsSheet ? "sheet" : "inline"}
    </p>
  );
}
