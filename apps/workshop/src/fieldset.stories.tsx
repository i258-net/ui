import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Fieldset, ToggleChip } from "@i258/ui";
import { chromaticPilotParameters } from "../.storybook/modes";

const meta = {
  title: "Primitives/Fieldset",
  component: Fieldset,
  args: {
    legend: "status",
    children: (
      <>
        <ToggleChip pressed>todo</ToggleChip>
        <ToggleChip>blocked</ToggleChip>
      </>
    ),
  },
  parameters: {
    controls: {
      include: ["legend", "emphasis", "disabled"],
    },
  },
  argTypes: {
    emphasis: {
      control: "select",
      options: ["default", "primary"],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PrimaryLegend: Story = {
  args: {
    legend: "human_required",
    emphasis: "primary",
  },
};

/** Honeycomb BoardClient filter row shape — legend + ToggleChips + actions. */
export const FilterRow: Story = {
  parameters: chromaticPilotParameters,
  render: function FilterRowStory() {
    const [active, setActive] = React.useState(new Set(["todo", "in-progress"]));
    const toggle = (value: string) =>
      setActive((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
      });

    const statuses = ["backlog", "todo", "in-progress", "blocked", "done"];

    return (
      <Fieldset legend="status">
        {statuses.map((v) => (
          <ToggleChip
            key={v}
            size="sm"
            pressed={active.has(v)}
            onClick={() => toggle(v)}
          >
            {v}
          </ToggleChip>
        ))}
        <Button variant="secondary" size="sm">
          all six
        </Button>
      </Fieldset>
    );
  },
};

/** Representative matrix for Playwright VRT (light + dark). */
export const Matrix: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <Fieldset legend="human_required" emphasis="primary">
        <ToggleChip size="sm" pressed>
          decision
        </ToggleChip>
        <ToggleChip size="sm">action</ToggleChip>
        <ToggleChip size="sm">no</ToggleChip>
      </Fieldset>
      <Fieldset legend="priority">
        <ToggleChip size="sm" pressed count={3}>
          urgent
        </ToggleChip>
        <ToggleChip size="sm" count={12}>
          high
        </ToggleChip>
        <ToggleChip size="sm">any</ToggleChip>
      </Fieldset>
    </div>
  ),
};
