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
};

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
}: FrameDemoProps) {
  const { navIsSheet } = useFrameLayout();
  const [mode, setMode] = React.useState<SidebarMode>(initialMode);
  const [navOpen, setNavOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(initialInspector);
  const row = ROWS.find((r) => r.id === selected);

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
      sidebar={<DemoSidebar />}
      sidebarMode={mode}
      onSidebarHandleActivate={() => setMode("rail")}
      navSheetOpen={navOpen}
      onNavSheetOpenChange={setNavOpen}
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
        if (!open) setSelected(null);
      }}
      inspectorLabel="Item details"
    >
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
