import { Label } from "@i258/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Primitives/Label",
  component: Label,
  args: {
    children: "Label",
  },
  parameters: {
    controls: {
      include: ["children", "htmlFor"],
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
