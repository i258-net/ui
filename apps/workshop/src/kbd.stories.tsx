import { ariaKeyShortcuts, Button, formatShortcut, Kbd } from "@i258/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

/**
 * A key cap. `formatShortcut(binding)` spells a binding for the current
 * platform (`⌘K` on Apple, `Ctrl+K` elsewhere); `ariaKeyShortcuts` gives
 * the matching `aria-keyshortcuts` value.
 */
const meta = {
  title: "Primitives/Kbd",
  component: Kbd,
  args: { children: "K" },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Each platform's spelling of the same bindings, and keys in a run of text. */
export const Bindings: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, fontSize: "var(--i258-text-sm)" }}>
      {(["mod+k", "mod+shift+p", "alt+1", "Enter", "Escape", "?"] as const).map((b) => (
        <div key={b} style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <code style={{ width: 120, fontFamily: "var(--i258-font-mono)" }}>{b}</code>
          <Kbd>{formatShortcut(b, true)}</Kbd>
          <Kbd>{formatShortcut(b, false)}</Kbd>
        </div>
      ))}
      <p style={{ margin: 0 }}>
        Press <Kbd>↑</Kbd>
        <Kbd>↓</Kbd> to move and <Kbd>↵</Kbd> to run.
      </p>
    </div>
  ),
};

/**
 * In a button the cap is a hint, not part of the name: `aria-hidden` on
 * the Kbd, the binding in `aria-keyshortcuts`.
 */
export const InAButton: Story = {
  name: "In a button",
  render: () => (
    <Button variant="secondary" aria-keyshortcuts={ariaKeyShortcuts("mod+k", false)}>
      Search
      <Kbd aria-hidden="true">{formatShortcut("mod+k", false)}</Kbd>
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button");
    await expect(button).toHaveAccessibleName("Search");
    await expect(button).toHaveAttribute("aria-keyshortcuts", "Control+K");
  },
};
