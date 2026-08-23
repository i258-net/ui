import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "@i258/ui";

const meta = {
  title: "Primitives/Label",
  component: Label,
  args: {
    children: "Label",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
