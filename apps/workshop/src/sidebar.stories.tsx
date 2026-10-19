import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Sidebar } from "@i258/ui";

import { DemoSidebar } from "./frame-fixtures";

/**
 * Sidebar family: Sidebar (aside) → SidebarHeader / SidebarContent (nav) /
 * SidebarFooter, SidebarSection (collapsible) and SidebarItem (link). On its
 * own it is the expanded sidebar; AppFrame adds the rail, the resize handle
 * and the narrow-screen sheet.
 */
const meta = {
  title: "Patterns/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ width: 240, height: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <DemoSidebar current="projects" />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const aside = c.getByRole("complementary", { name: "Sidebar" });
    const nav = within(aside).getByRole("navigation", { name: "Primary" });
    // Lists are named by their section.
    await expect(within(nav).getByRole("list", { name: "Workspace" })).toBeInTheDocument();
    const current = within(nav).getByRole("link", { name: /Projects/ });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(within(nav).getAllByRole("link").filter((a) => a.hasAttribute("aria-current"))).toHaveLength(1);
    // Counts carry screen-reader wording.
    await expect(within(nav).getByRole("link", { name: /Inbox/ })).toHaveAccessibleName(/^Inbox\s*, 12 unread$/);
  },
};

export const SectionKeyboard: Story = {
  name: "Section collapse (keyboard)",
  render: () => <DemoSidebar />,
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
