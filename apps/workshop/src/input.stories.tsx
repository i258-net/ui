import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input, Label } from "@i258/ui";

const meta = {
  title: "Primitives/Input",
  component: Input,
  args: {
    placeholder: "Placeholder",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 6, minWidth: 280 }}>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" {...args} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, minWidth: 280 }}>
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Disabled" },
};
