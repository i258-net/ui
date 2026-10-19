import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppFrame, FrameHeader, Inspector } from "./app-frame.js";
import { Sidebar, SidebarContent, SidebarItem, SidebarSection } from "./sidebar.js";
import { useMediaQuery } from "../lib/use-media-query.js";

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

  it("useMediaQuery returns its fallback", () => {
    function Probe() {
      return <>{String(useMediaQuery("(min-width: 1px)", true))}</>;
    }
    expect(renderToString(<Probe />)).toBe("true");
  });
});
