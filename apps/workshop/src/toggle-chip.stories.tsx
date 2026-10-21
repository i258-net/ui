import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ToggleChip } from "@i258/ui";
import { chromaticPilotParameters } from "../.storybook/modes";

const meta = {
  title: "Primitives/ToggleChip",
  component: ToggleChip,
  args: {
    children: "Filter",
    count: 12,
  },
  parameters: {
    controls: {
      include: ["children", "count", "size", "pressed", "disabled"],
    },
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    pressed: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof ToggleChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { pressed: false },
};

export const On: Story = {
  args: { pressed: true },
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [on, setOn] = React.useState(false);
    return (
      <ToggleChip
        pressed={on}
        count={7}
        onClick={() => setOn((v) => !v)}
      >
        Decision
      </ToggleChip>
    );
  },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("button", { name: "Decision 7" });
    const glyph = () => getComputedStyle(chip, "::before").content;
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    // Off: an empty box, so the label doesn't move when it fills.
    await expect(glyph()).toMatch(/^"" \/ ""$|^""$/);
    const offLeft = chip.querySelector(".i258-toggle-chip__label")!.getBoundingClientRect().left;
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    // On: a ✓ in the box, so the state isn't colour alone. It's out of the name.
    await expect(glyph()).toContain("✓");
    await expect(chip).toHaveAccessibleName("Decision 7");
    const onLeft = chip.querySelector(".i258-toggle-chip__label")!.getBoundingClientRect().left;
    await expect(onLeft).toBe(offLeft);
  },
};

export const Row: Story = {
  parameters: chromaticPilotParameters,
  render: function RowStory() {
    const [active, setActive] = React.useState("all");
    const chips = [
      { id: "all", label: "All", count: 40 },
      { id: "open", label: "Open", count: 12 },
      { id: "blocked", label: "Blocked", count: 3 },
    ];
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {chips.map((c) => (
          <ToggleChip
            key={c.id}
            pressed={active === c.id}
            count={c.count}
            onClick={() => setActive(c.id)}
          >
            {c.label}
          </ToggleChip>
        ))}
      </div>
    );
  },
};
