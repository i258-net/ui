import * as React from "react";
import {
  AppFrame,
  Button,
  FrameHeader,
  Inspector,
  useFrameLayout,
  type AppFrameProps,
  type SidebarMode,
} from "@i258/ui";

import { DemoSidebar, LongContent, ROWS, icons } from "./frame-fixtures";

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
};

export type FrameDemoHooks = {
  setNavOpen: (open: boolean) => void;
  setSelected: (id: string | null) => void;
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
}: FrameDemoProps) {
  const { navIsSheet } = useFrameLayout();
  const [mode, setMode] = React.useState<SidebarMode>(initialMode);
  const [navOpen, setNavOpen] = React.useState(initialNavOpen);
  const [selected, setSelected] = React.useState<string | null>(initialInspector);
  const [widths, setWidths] = React.useState(controlledWidths);
  const row = ROWS.find((r) => r.id === selected);

  const calls = React.useRef<string[]>([]);
  React.useEffect(() => {
    if (!testHooks) return;
    window.__frameDemo = { setNavOpen, setSelected, calls: calls.current };
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
      dir={dir}
      data-demo-nav-open={navOpen ? "" : undefined}
      data-demo-selected={selected ?? undefined}
      sidebar={
        <DemoSidebar
          footer={
            testHooks ? (
              <Button variant="secondary" size="sm" onClick={() => setSelected("item-5")}>
                Open latest record
              </Button>
            ) : null
          }
        />
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
                  <Button variant="secondary" size="sm">Filter</Button>
                  <Button variant="secondary" size="sm">Sort</Button>
                  <Button variant="secondary" size="sm">Export</Button>
                </>
              ) : null}
              <Button size="sm">New item</Button>
            </>
          }
        />
      }
      inspector={
        row ? (
          <Inspector
            eyebrow={row.id}
            title={row.title}
            onClose={() => setSelected(null)}
          >
            <p style={{ margin: 0 }}>
              Details for {row.title}. Synthetic content for the frame demo.
            </p>
          </Inspector>
        ) : null
      }
      inspectorOpen={row != null}
      onInspectorOpenChange={(open) => {
        log(`inspector:${open}`);
        if (!open) setSelected(null);
      }}
      inspectorLabel="Item details"
    >
      {widths ? (
        <p data-testid="stored-widths" style={{ marginTop: 0 }}>
          Stored widths: sidebar {widths.sidebar}, inspector {widths.inspector}
        </p>
      ) : null}
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
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
