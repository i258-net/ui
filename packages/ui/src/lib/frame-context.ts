import * as React from "react";

/*
  Private wiring between AppFrame and the pieces rendered inside it. Not
  exported from the package: apps compose Sidebar / FrameHeader / Inspector
  and AppFrame supplies these.
*/

export type SidebarMode = "expanded" | "rail" | "hidden";

/** How the sidebar is drawn. Standalone (no AppFrame) it is expanded. */
export const SidebarModeContext = React.createContext<SidebarMode>("expanded");

/**
 * The sidebar's resize handle. AppFrame builds it; Sidebar renders it inside
 * its `aside`, so the separator belongs to the sidebar landmark rather than
 * sitting between landmarks.
 */
export const SidebarHandleContext = React.createContext<React.ReactNode>(null);

/**
 * Where floating layers inside the frame portal to. A layer inside the
 * frame root inherits its `data-theme` / `data-density` ancestors, which a
 * portal to `document.body` would not. `null` outside a frame (Base UI then
 * portals to the body).
 */
export const FramePortalContext = React.createContext<HTMLElement | null>(null);

/**
 * FrameHeader hands its element to AppFrame, which measures it for the main
 * pane's scroll padding. A ref callback, so a remounted header re-registers.
 */
export const FrameHeaderRefContext = React.createContext<
  ((el: HTMLElement | null) => void) | null
>(null);
