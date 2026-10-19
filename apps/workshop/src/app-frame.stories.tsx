import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { AppFrame } from "@i258/ui";

import { FrameDemo } from "./frame-demo";

/**
 * The application frame: sidebar · header / main · inspector.
 *
 * Shared narrow-screen defaults (accepted in I25-119): below 768px the
 * sidebar is a modal start sheet, below 980px the inspector is a modal end
 * sheet. Story tests run at 1280×800; the narrow sheets, 320px reflow,
 * scroll padding, coarse targets and forced colours are checked against
 * real viewports in `vrt/frame.spec.ts`.
 */
const meta = {
  title: "Patterns/AppFrame",
  component: AppFrame,
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "560px" } },
  },
} satisfies Meta<typeof AppFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The plain frame. No play function: vrt/frame.spec.ts drives this one. */
export const Default: Story = {
  render: () => <FrameDemo />,
};

export const Landmarks: Story = {
  name: "Landmarks and skip link",
  render: () => <FrameDemo />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Landmarks: one banner, one main, the sidebar aside and its nav.
    await expect(c.getByRole("banner")).toBeInTheDocument();
    const main = c.getByRole("main");
    await expect(c.getByRole("complementary", { name: "Sidebar" })).toBeInTheDocument();
    await expect(c.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    await expect(c.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    await expect(c.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expect(c.getByRole("link", { name: /Inbox/ })).toHaveAttribute("aria-current", "page");
    await expect(c.getByRole("link", { name: /Reports/ })).toHaveAccessibleName(/^Reports\s*, 2 failing$/);

    // The skip link is the first stop and moves focus to <main>.
    await userEvent.tab();
    const skip = c.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toHaveFocus();
    await expect(skip).toHaveAttribute("href", `#${main.id}`);
    await userEvent.keyboard("{Enter}");
    await expect(main).toHaveFocus();
  },
};

export const ResizeSidebar: Story = {
  name: "Resize sidebar (keyboard)",
  render: () => <FrameDemo />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const handle = c.getByRole("separator", { name: "Resize sidebar" });
    const pane = canvasElement.querySelector<HTMLElement>(".i258-frame__sidebar")!;
    await expect(handle).toHaveAttribute("aria-orientation", "vertical");
    await expect(handle).toHaveAttribute("aria-valuenow", "240");
    await expect(handle).toHaveAttribute("aria-valuemin", "200");
    await expect(handle).toHaveAttribute("aria-valuemax", "400");
    await expect(handle).toHaveAttribute("aria-controls", pane.id);

    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", "256");
    await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    await expect(handle).toHaveAttribute("aria-valuenow", "200");
    await userEvent.keyboard("{End}");
    await expect(handle).toHaveAttribute("aria-valuenow", "400");
    await waitFor(() => expect(pane.getBoundingClientRect().width).toBe(400));
    await userEvent.keyboard("{Home}");
    await expect(handle).toHaveAttribute("aria-valuenow", "200");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(handle).toHaveAttribute("aria-valuenow", "200");

    // Enter runs the app's activate action — here, collapse to the rail.
    // The handle goes with it; focus lands on the current item, not <body>.
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(canvasElement.querySelector(".i258-sidebar")).toHaveAttribute("data-collapsed"),
    );
    await expect(c.queryByRole("separator", { name: "Resize sidebar" })).toBeNull();
    await expect(c.getByRole("link", { name: /Inbox/ })).toHaveFocus();
  },
};

export const RailCollapse: Story = {
  name: "Rail collapse keeps focus",
  render: () => <FrameDemo />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const item = c.getByRole("link", { name: /Projects/ });
    item.focus();
    // Collapse without moving focus (as a keyboard shortcut would).
    fireEvent.click(c.getByTestId("rail-toggle"));
    const sidebar = canvasElement.querySelector(".i258-sidebar")!;
    await waitFor(() => expect(sidebar).toHaveAttribute("data-collapsed"));
    // Same node, still focused, still named.
    await expect(c.getByRole("link", { name: /Projects/ })).toBe(item);
    await expect(item).toHaveFocus();
    await expect(item).toHaveAccessibleName("Projects");

    // Section headers give way to dividers in the rail. Focus on one when
    // the rail comes in moves to the current item.
    fireEvent.click(c.getByTestId("rail-toggle"));
    await waitFor(() => expect(sidebar).not.toHaveAttribute("data-collapsed"));
    const trigger = c.getByRole("button", { name: "Saved" });
    trigger.focus();
    fireEvent.click(c.getByTestId("rail-toggle"));
    await waitFor(() => expect(c.getByRole("link", { name: /Inbox/ })).toHaveFocus());
  },
};

export const WithInspector: Story = {
  name: "Inspector (close returns focus)",
  render: () => <FrameDemo />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const opener = c.getByRole("button", { name: "Open Example record 3" });
    opener.focus();
    await userEvent.keyboard("{Enter}");
    const pane = await c.findByRole("complementary", { name: "Item details" });
    await expect(within(pane).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Example record 3",
    );
    const handle = within(pane).getByRole("separator", { name: "Resize inspector" });
    await expect(handle).toHaveAttribute("aria-valuenow", "400");
    // A start-edge handle grows toward the inline start: ← widens.
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(handle).toHaveAttribute("aria-valuenow", "416");

    within(pane).getByRole("button", { name: "Close inspector" }).focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(c.queryByRole("complementary", { name: "Item details" })).toBeNull());
    await expect(opener).toHaveFocus();
  },
};

/** Rail, compact density, dark theme. Driven by vrt/frame.spec.ts. */
export const CompactDarkRail: Story = {
  name: "Rail, compact, dark",
  globals: { theme: "dark" },
  render: () => <FrameDemo initialMode="rail" density="compact" />,
};

export const PortalInheritance: Story = {
  name: "Rail names inherit theme and density",
  globals: { theme: "dark" },
  render: () => <FrameDemo initialMode="rail" density="compact" />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const frame = canvasElement.querySelector<HTMLElement>(".i258-frame")!;
    await expect(frame).toHaveAttribute("data-density", "compact");
    const item = c.getByRole("link", { name: /Reports/ });
    // Keyboard focus shows the name.
    item.focus();
    fireEvent.focus(item);
    const tip = await waitFor(() => {
      const el = frame.querySelector<HTMLElement>(".i258-sidebar__tip");
      expect(el).not.toBeNull();
      return el!;
    });
    await waitFor(() => expect(tip).toHaveTextContent("Reports2"));
    // Portaled into the frame's layer, so it sits under the frame's
    // density and theme rather than <body>.
    await expect(tip.closest(".i258-frame__layer")).not.toBeNull();
    await expect(tip.closest("[data-density]")).toBe(frame);
    await expect(tip.closest("[data-theme]")).toHaveAttribute("data-theme", "dark");
    const tipStyle = getComputedStyle(tip);
    await expect(tipStyle.getPropertyValue("--i258-control-md").trim()).toBe("1.75rem");
    const probe = document.createElement("div");
    probe.style.background = "var(--i258-surface-raised)";
    frame.append(probe);
    const expected = getComputedStyle(probe).backgroundColor;
    probe.remove();
    await expect(tipStyle.backgroundColor).toBe(expected);
  },
};

export const LongContent: Story = {
  name: "Long content (scroll padding)",
  render: () => <FrameDemo long manyActions />,
};

/**
 * Server render then hydrate in the browser: the frame's markup must match
 * on both sides (generated ids, no width-dependent markup at hydration).
 */
export const Hydration: Story = {
  name: "SSR hydration",
  render: () => <div data-testid="ssr-host" />,
  play: async ({ canvasElement }) => {
    const host = within(canvasElement).getByTestId("ssr-host");
    host.innerHTML = renderToString(<FrameDemo initialInspector="item-2" />);
    const errors: unknown[] = [];
    const root = hydrateRoot(host, <FrameDemo initialInspector="item-2" />, {
      onRecoverableError: (e) => errors.push(e),
    });
    await waitFor(() =>
      expect(host.querySelector(".i258-frame__inspector")).not.toBeNull(),
    );
    await new Promise((r) => setTimeout(r, 50));
    root.unmount();
    await expect(errors).toEqual([]);
  },
};
