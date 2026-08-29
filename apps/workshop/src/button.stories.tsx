import type { Meta, StoryObj } from "@storybook/react-vite";
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
      include: ["children", "variant", "size", "disabled"],
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
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
