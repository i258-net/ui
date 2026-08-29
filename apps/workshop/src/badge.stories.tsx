import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@i258/ui";
import { chromaticPilotParameters } from "../.storybook/modes";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  args: {
    children: "Badge",
  },
  parameters: {
    controls: {
      include: ["children", "variant"],
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "accent", "success", "warning", "danger"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { variant: "neutral" },
};

export const Accent: Story = {
  args: { variant: "accent", children: "New" },
};

export const Status: Story = {
  parameters: chromaticPilotParameters,
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge variant="success">Healthy</Badge>
      <Badge variant="warning">Degraded</Badge>
      <Badge variant="danger">Failed</Badge>
    </div>
  ),
};
