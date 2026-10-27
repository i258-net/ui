import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useMediaQuery } from "../lib/use-media-query.js";
import { AppFrame, FrameHeader, Inspector } from "./app-frame.js";
import { Sidebar, SidebarContent, SidebarItem, SidebarSection } from "./sidebar.js";

/*
  Server render with no `window` / `matchMedia`: the frame must not touch
  the DOM during render, and sheets (which depend on the viewport) are not
  in the server markup — the wide layout is, matching the first client
  render so hydration agrees.
*/
describe("AppFrame on the server", () => {
  it("renders the wide layout without a window", () => {
    expect(typeof window).toBe("undefined");
    const html = renderToString(
      <AppFrame
        mainId="main"
        sidebar={
          <Sidebar>
            <SidebarContent>
              <SidebarSection title="Workspace">
                <SidebarItem href="#a" current>
                  Inbox
                </SidebarItem>
              </SidebarSection>
            </SidebarContent>
          </Sidebar>
        }
        header={<FrameHeader title="Inbox" />}
        inspector={<Inspector title="Details" onClose={() => {}} />}
        inspectorOpen
        inspectorLabel="Details"
      >
        content
      </AppFrame>,
    );
    expect(html).toContain('href="#main"');
    expect(html).toContain('<main id="main"');
    expect(html).toContain('data-sidebar="expanded"');
    expect(html).toContain('aria-label="Details"');
    expect(html).toContain('role="separator"');
    expect(html).not.toContain('role="dialog"');
  });

  it("renders no sheet and unfitted, finite handle values before the viewport is known", () => {
    const html = renderToString(
      <AppFrame
        sidebar={<Sidebar />}
        sidebarWidth={400}
        navSheetOpen
        inspector={<Inspector title="Details" />}
        inspectorOpen
        inspectorWidth={720}
      >
        content
      </AppFrame>,
    );
    expect(html).not.toContain('role="dialog"');
    expect(html).toContain('aria-valuenow="400"');
    expect(html).toContain('aria-valuemax="400"');
    expect(html).toContain('aria-valuenow="720"');
    expect(html).toContain('aria-valuemax="720"');
  });

  it("accepts a consumer ref without touching it on the server", () => {
    const objectRef = React.createRef<HTMLDivElement>();
    const calls: unknown[] = [];
    const html = renderToString(
      <>
        <AppFrame ref={objectRef} sidebar={<Sidebar />}>
          a
        </AppFrame>
        <AppFrame ref={(el) => void calls.push(el)} sidebar={<Sidebar />}>
          b
        </AppFrame>
      </>,
    );
    expect(html.match(/data-slot="app-frame"/g)).toHaveLength(2);
    expect(objectRef.current).toBeNull();
    expect(calls).toEqual([]);
  });

  it("useMediaQuery returns its fallback", () => {
    function Probe() {
      return <>{String(useMediaQuery("(min-width: 1px)", true))}</>;
    }
    expect(renderToString(<Probe />)).toBe("true");
  });
});
