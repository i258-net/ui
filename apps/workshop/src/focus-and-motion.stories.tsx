import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Input, Label, Link } from "@i258/ui";

const meta = {
  title: "Foundation/FocusAndMotion",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const VisibleFocus: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: 16,
        maxWidth: 420,
        fontFamily: "var(--i258-font-sans)",
      }}
    >
      <p style={{ margin: 0, color: "var(--i258-muted)", fontSize: 14 }}>
        Tab through these controls. Focus uses{" "}
        <code>--i258-focus-ring</code> with offset; interactive primitives share
        the same ring tokens.
      </p>
      <Button>Focusable button</Button>
      <div style={{ display: "grid", gap: 6 }}>
        <Label htmlFor="focus-input">Focusable input</Label>
        <Input id="focus-input" placeholder="Tab here" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox id="focus-check" aria-labelledby="focus-check-label" />
        <Label id="focus-check-label" htmlFor="focus-check">
          Focusable checkbox
        </Label>
      </div>
      <Link href="#focus">Focusable link</Link>
    </div>
  ),
};

export const ReducedMotion: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: 12,
        maxWidth: 480,
        fontFamily: "var(--i258-font-sans)",
        fontSize: 14,
        color: "var(--i258-muted)",
      }}
    >
      <p style={{ margin: 0 }}>
        Transitions use <code>--i258-duration-fast</code> /{" "}
        <code>--i258-ease-standard</code>. Under{" "}
        <code>prefers-reduced-motion: reduce</code>, button / input / link /
        checkbox transitions are disabled in the shipped CSS.
      </p>
      <p style={{ margin: 0 }}>
        Verify in DevTools → Rendering → emulate CSS{" "}
        <code>prefers-reduced-motion: reduce</code>, then hover a primary
        button.
      </p>
      <Button>Hover me</Button>
    </div>
  ),
};
