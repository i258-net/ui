import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
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

/** A mouse press/move/release at `x`, dispatched on the handle. */
function pointer(el: Element, type: string, x: number) {
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: type === "pointermove" ? -1 : 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: x,
      clientY: rect.top + rect.height / 2,
    }),
  );
}

async function drag(el: Element, dx: number) {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  pointer(el, "pointerdown", x);
  pointer(el, "pointermove", x + dx);
  await waitFor(() => expect(el).not.toHaveAttribute("aria-valuenow", "240"));
  pointer(el, "pointerup", x + dx);
  if (el.hasPointerCapture(1)) el.releasePointerCapture(1);
}

const resizing = () => document.documentElement.dataset.i258Resizing;

/** Right-to-left pointer drag: the start pane is on the right, so dragging left widens it. */
export const RightToLeftDrag: Story = {
  name: "Right to left drag",
  tags: ["!autodocs"],
  render: (args) => <Panes {...args} rtl />,
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator", { name: "Resize panel" });
    await drag(handle, -40);
    await expect(handle).toHaveAttribute("aria-valuenow", "280");
    await expect(resizing()).toBeUndefined();
  },
};

/**
 * The caller's event handlers run before the handle's own, and resizing
 * still works when they do nothing.
 */
export const ComposedHandlers: Story = {
  name: "Composed handlers",
  tags: ["!autodocs"],
  args: {
    onPointerDown: fn(),
    onPointerMove: fn(),
    onPointerUp: fn(),
    onPointerCancel: fn(),
    onLostPointerCapture: fn(),
    onDoubleClick: fn(),
    onKeyDown: fn(),
  },
  render: (args) => <Panes {...args} />,
  play: async ({ canvasElement, args }) => {
    const handle = within(canvasElement).getByRole("separator", { name: "Resize panel" });
    await drag(handle, 40);
    await expect(handle).toHaveAttribute("aria-valuenow", "280");
    await expect(args.onPointerDown).toHaveBeenCalled();
    await expect(args.onPointerMove).toHaveBeenCalled();
    await expect(args.onPointerUp).toHaveBeenCalled();
    await expect(resizing()).toBeUndefined();

    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", "296");
    await expect(args.onKeyDown).toHaveBeenCalled();

    await userEvent.dblClick(handle);
    await expect(args.onDoubleClick).toHaveBeenCalled();
    await expect(args.onActivate).toHaveBeenCalledTimes(1);

    // A cancelled pointer ends the drag and reaches the caller.
    const x = handle.getBoundingClientRect().left;
    pointer(handle, "pointerdown", x);
    await expect(resizing()).toBeDefined();
    pointer(handle, "pointercancel", x);
    await expect(args.onPointerCancel).toHaveBeenCalled();
    await expect(resizing()).toBeUndefined();
    if (handle.hasPointerCapture(1)) handle.releasePointerCapture(1);
  },
};

/**
 * `preventDefault()` in the caller's handler opts that event out: no drag,
 * no keyboard step, no `onActivate`. It can't keep a drag from ending.
 */
export const PreventedHandlers: Story = {
  name: "Prevented handlers",
  tags: ["!autodocs"],
  render: (args) => {
    const [blockDown, setBlockDown] = React.useState(true);
    return (
      <>
        <button type="button" onClick={() => setBlockDown(false)}>
          Allow drags
        </button>
        <Panes
          {...args}
          onPointerDown={(e) => blockDown && e.preventDefault()}
          onKeyDown={(e) => e.key === "ArrowRight" && e.preventDefault()}
          onDoubleClick={(e) => e.preventDefault()}
          onPointerUp={(e) => e.preventDefault()}
          onLostPointerCapture={(e) => e.preventDefault()}
        />
      </>
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole("separator", { name: "Resize panel" });
    const x = handle.getBoundingClientRect().left;

    pointer(handle, "pointerdown", x);
    await expect(resizing()).toBeUndefined();
    pointer(handle, "pointermove", x + 40);
    pointer(handle, "pointerup", x + 40);
    await expect(handle).toHaveAttribute("aria-valuenow", "240");

    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", "240");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(handle).toHaveAttribute("aria-valuenow", "224");

    await userEvent.dblClick(handle);
    await expect(args.onActivate).not.toHaveBeenCalled();

    // Prevented pointerup still ends the drag: later moves don't resize.
    await userEvent.click(canvas.getByRole("button", { name: "Allow drags" }));
    await drag(handle, 40);
    await expect(handle).toHaveAttribute("aria-valuenow", "264");
    await expect(resizing()).toBeUndefined();
    pointer(handle, "pointermove", x + 200);
    await new Promise((r) => requestAnimationFrame(r));
    await expect(handle).toHaveAttribute("aria-valuenow", "264");
  },
};

/**
 * The document-wide resizing state belongs to the drag that set it: an
 * idle handle unmounting mid-drag elsewhere leaves it alone, and a handle
 * unmounting mid-drag clears only its own.
 */
export const SharedResizingState: Story = {
  name: "Shared resizing state",
  tags: ["!autodocs"],
  render: (args) => {
    const [a, setA] = React.useState(true);
    const [b, setB] = React.useState(true);
    const [wa, setWa] = React.useState(240);
    const [wb, setWb] = React.useState(240);
    return (
      <div style={{ display: "flex", gap: 120, padding: 40, position: "relative" }}>
        <button type="button" onClick={() => setA(false)}>
          Remove A
        </button>
        <button type="button" onClick={() => setB(false)}>
          Remove B
        </button>
        {a ? (
          <div style={{ position: "relative", width: 40, height: 120 }}>
            <PaneResizeHandle {...args} label="Resize A" value={wa} onValueChange={setWa} />
          </div>
        ) : null}
        {b ? (
          <div style={{ position: "relative", width: 40, height: 120 }}>
            <PaneResizeHandle {...args} label="Resize B" value={wb} onValueChange={setWb} />
          </div>
        ) : null}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handleA = canvas.getByRole("separator", { name: "Resize A" });
    const x = handleA.getBoundingClientRect().left;

    // Another frame (or another copy of the kit) is mid-drag too.
    document.documentElement.dataset.i258Resizing = "elsewhere";
    pointer(handleA, "pointerdown", x);
    await expect(resizing()?.split(" ")).toHaveLength(2);

    // Idle B goes away: A's drag and the other one are untouched.
    await userEvent.click(canvas.getByRole("button", { name: "Remove B" }));
    await expect(canvas.queryByRole("separator", { name: "Resize B" })).toBeNull();
    await expect(resizing()?.split(" ")).toHaveLength(2);

    // A goes away mid-drag: only its own claim is released.
    if (handleA.hasPointerCapture(1)) handleA.releasePointerCapture(1);
    await userEvent.click(canvas.getByRole("button", { name: "Remove A" }));
    await expect(canvas.queryByRole("separator", { name: "Resize A" })).toBeNull();
    await expect(resizing()).toBe("elsewhere");
    delete document.documentElement.dataset.i258Resizing;
  },
};
