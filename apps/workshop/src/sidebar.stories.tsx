import { Sidebar } from "@i258/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FrameDemo } from "./frame-demo";
import { DemoSidebar } from "./frame-fixtures";

/**
 * Sidebar family: Sidebar (aside) → SidebarHeader / SidebarContent (nav) /
 * SidebarFooter, SidebarSection (collapsible) and SidebarItem (link). On its
 * own it is the expanded sidebar; AppFrame adds the rail, the resize handle
 * and the narrow-screen sheet.
 *
 * In the rail each item's name (and count) is a kit Tooltip: on hover,
 * keyboard focus and a touch long-press. The tip is `aria-hidden`, so the
 * link keeps its own name, and Escape closes only the tip. Sidebar brings
 * its own TooltipProvider for the rail.
 */
const meta = {
  title: "Patterns/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

function Standalone({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 240, height: 420 }}>{children}</div>;
}

const tip = () => document.querySelector<HTMLElement>("[data-slot='tooltip']");

export const Default: Story = {
  render: () => (
    <Standalone>
      <DemoSidebar current="projects" />
    </Standalone>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const aside = c.getByRole("complementary", { name: "Sidebar" });
    const nav = within(aside).getByRole("navigation", { name: "Primary" });
    // Lists are named by their section.
    await expect(within(nav).getByRole("list", { name: "Workspace" })).toBeInTheDocument();
    const current = within(nav).getByRole("link", { name: /Projects/ });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(
      within(nav)
        .getAllByRole("link")
        .filter((a) => a.hasAttribute("aria-current")),
    ).toHaveLength(1);
    // Counts carry screen-reader wording.
    await expect(within(nav).getByRole("link", { name: /Inbox/ })).toHaveAccessibleName(
      /^Inbox\s*, 12 unread$/,
    );
    // Expanded, the names are on screen: no tips.
    await userEvent.hover(current);
    await new Promise((r) => setTimeout(r, 400));
    await expect(tip()).toBeNull();
  },
};

export const SectionKeyboard: Story = {
  name: "Section collapse (keyboard)",
  render: () => (
    <Standalone>
      <DemoSidebar />
    </Standalone>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const trigger = c.getByRole("button", { name: "Workspace" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(c.queryByRole("link", { name: /Inbox/ })).toBeNull();
    // Collapsed items leave the tab order.
    await userEvent.tab();
    await expect(c.getByRole("button", { name: "Saved" })).toHaveFocus();
    trigger.focus();
    await userEvent.keyboard(" ");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(c.getByRole("link", { name: /Inbox/ })).toBeVisible();
  },
};

/** The rail in a frame, nothing open. Screenshots and touch: vrt/frame*.spec.ts. */
export const Rail: Story = {
  render: () => <FrameDemo initialMode="rail" />,
};

/**
 * Rail names by keyboard and pointer. With an inline inspector open and
 * Escape bound to close it (as an app would), Escape closes the tip first
 * and the inspector only on the next press; focus never moves.
 */
export const RailNames: Story = {
  name: "Rail names (keyboard, hover, Escape)",
  render: () => <FrameDemo initialMode="rail" initialInspector="item-1" escapeClosesInspector />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const inspector = c.getByRole("complementary", { name: "Item details" });
    const reports = c.getByRole("link", { name: /Reports/ });
    const projects = c.getByRole("link", { name: /Projects/ });

    // Keyboard: Tab onto an item shows its name and count.
    projects.focus();
    await userEvent.tab();
    await expect(reports).toHaveFocus();
    // Wait for Reports' own tip: Projects' may still be closing.
    await waitFor(() => {
      expect(document.querySelectorAll("[data-slot='tooltip']")).toHaveLength(1);
      expect(tip()).toHaveTextContent("Reports2");
    });
    await expect(tip()).toBeVisible();
    await expect(tip()).toHaveAttribute("aria-hidden", "true");
    await expect(tip()!.closest(".i258-frame__layer")).not.toBeNull();
    // The link's own name, not described by the tip.
    await expect(reports).toHaveAccessibleName(/^Reports\s*, 2 failing$/);
    await expect(reports).not.toHaveAttribute("aria-describedby");

    // Escape closes the tip only; the inspector waits for the next press.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip()).toBeNull());
    await expect(reports).toHaveFocus();
    await expect(inspector).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(c.queryByRole("complementary", { name: "Item details" })).toBeNull(),
    );

    // Hover, with focus elsewhere.
    await userEvent.hover(projects);
    await waitFor(() => expect(tip()).toHaveTextContent("Projects"));
    await userEvent.unhover(projects);
    await waitFor(() => expect(tip()).toBeNull());
  },
};
