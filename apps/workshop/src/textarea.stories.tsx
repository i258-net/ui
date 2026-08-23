import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label, Textarea } from "@i258/ui";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  args: {
    placeholder: "Notes…",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 6, minWidth: 280 }}>
      <Label htmlFor="notes">Notes</Label>
      <Textarea id="notes" {...args} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, minWidth: 280 }}>
      <Textarea size="sm" placeholder="Small" />
      <Textarea size="md" placeholder="Medium" />
      <Textarea size="lg" placeholder="Large" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Disabled" },
};
