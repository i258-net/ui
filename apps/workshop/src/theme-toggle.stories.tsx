import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeToggle } from "@i258/ui";

const meta = {
  title: "Primitives/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    controls: {
      include: ["size", "variant", "disabled", "duration"],
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
    duration: { control: { type: "number", min: 0, max: 1000, step: 50 } },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
