import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PaneResizeHandle } from "@i258/ui";

/**
 * Window-splitter: `role="separator"` with a value. ←/→ step 16px (Shift:
 * 64px), Home/End jump to min/max, Enter (or double-click) runs
 * `onActivate`. AppFrame uses it for both panes.
 */
const meta = {
  title: "Patterns/PaneResizeHandle",
  component: PaneResizeHandle,
  parameters: { layout: "fullscreen" },
  args: {
    label: "Resize panel",
    value: 240,
    min: 160,
    max: 400,
    edge: "end",
    onValueChange: () => {},
    onActivate: fn(),
  },
} satisfies Meta<typeof PaneResizeHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

function Panes({
  rtl = false,
  ...handle
}: React.ComponentProps<typeof PaneResizeHandle> & { rtl?: boolean | undefined }) {
  const dir = rtl ? "rtl" : "ltr";
  const [width, setWidth] = React.useState(handle.value);
  return (
    <div dir={dir} style={{ display: "flex", height: 240 }}>
      <div
        id="demo-pane"
        style={{
          position: "relative",
          width,
          borderInlineEnd: "1px solid var(--i258-border)",
          background: "var(--i258-surface)",
          padding: 12,
          boxSizing: "border-box",
        }}
      >
        {width}px
        <PaneResizeHandle {...handle} value={width} onValueChange={setWidth} controls="demo-pane" />
      </div>
      <div style={{ flex: 1, padding: 12, paddingInlineStart: 36 }}>Content</div>
    </div>
  );
}

export const Keyboard: Story = {
  render: (args) => <Panes {...args} />,
  play: async ({ canvasElement, args }) => {
    const handle = within(canvasElement).getByRole("separator", { name: "Resize panel" });
    await expect(handle).toHaveAttribute("tabindex", "0");
    await expect(handle).toHaveAttribute("aria-orientation", "vertical");
    await expect(handle).toHaveAttribute("aria-controls", "demo-pane");
    await userEvent.tab();
    await expect(handle).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", "256");
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    await expect(handle).toHaveAttribute("aria-valuenow", "320");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(handle).toHaveAttribute("aria-valuenow", "304");
    await userEvent.keyboard("{End}");
    await expect(handle).toHaveAttribute("aria-valuenow", "400");
    await userEvent.keyboard("{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", "400");
    await userEvent.keyboard("{Home}");
    await expect(handle).toHaveAttribute("aria-valuenow", "160");
    await userEvent.keyboard("{Enter}");
    await expect(args.onActivate).toHaveBeenCalledTimes(1);
  },
};

/** Right-to-left: the start pane is on the right, so ← widens it. */
export const RightToLeft: Story = {
  name: "Right to left",
  render: (args) => <Panes {...args} rtl />,
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator", { name: "Resize panel" });
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(handle).toHaveAttribute("aria-valuenow", "256");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", "224");
  },
};
