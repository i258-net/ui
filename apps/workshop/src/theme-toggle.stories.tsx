import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeToggle } from "@i258/ui";

const meta = {
  title: "Primitives/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    controls: {
      include: ["size", "variant", "disabled"],
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
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
