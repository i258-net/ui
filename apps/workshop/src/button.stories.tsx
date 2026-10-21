import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button } from "@i258/ui";
import { chromaticPilotParameters } from "../.storybook/modes";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: {
    children: "Button",
  },
  parameters: {
    controls: {
      include: ["children", "variant", "size", "shape", "disabled"],
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
    },
    shape: {
      control: "select",
      options: ["default", "icon"],
    },
    disabled: { control: "boolean" },
    asChild: { table: { disable: true } },
    render: { table: { disable: true } },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
  parameters: chromaticPilotParameters,
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Danger: Story = {
  args: { variant: "danger" },
};

export const Sizes: Story = {
  parameters: chromaticPilotParameters,
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/** `xs` is the 24px floor: compact density doesn't shrink it. */
export const ExtraSmall: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }} data-density="compact">
      <Button size="xs">Extra small</Button>
      <Button size="xs" variant="secondary">
        Undo
      </Button>
      <Button size="sm" variant="secondary">
        Small (compact)
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const xs = c.getByRole("button", { name: "Extra small" }).getBoundingClientRect();
    await expect(Math.round(xs.height)).toBe(24);
    await expect(xs.width).toBeGreaterThanOrEqual(24);
  },
};

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * `shape="icon"`: square at every size. An icon-only button needs its own
 * name (`aria-label`); pair it with a Tooltip for sighted mouse users.
 */
export const IconOnly: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Button key={size} size={size} shape="icon" variant="ghost" aria-label={`New issue (${size})`}>
          <PlusIcon />
        </Button>
      ))}
      <Button shape="icon" variant="secondary" aria-label="New issue (secondary)">
        <PlusIcon />
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    for (const size of ["xs", "sm", "md", "lg"]) {
      const r = c.getByRole("button", { name: `New issue (${size})` }).getBoundingClientRect();
      await expect(Math.round(r.width)).toBe(Math.round(r.height));
    }
  },
};

