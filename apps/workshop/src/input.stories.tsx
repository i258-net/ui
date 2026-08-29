import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input, Label } from "@i258/ui";
import { chromaticPilotParameters } from "../.storybook/modes";

const meta = {
  title: "Primitives/Input",
  component: Input,
  args: {
    placeholder: "Placeholder",
  },
  parameters: {
    controls: {
      include: ["placeholder", "size", "disabled", "type"],
    },
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "url", "tel", "number"],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: chromaticPilotParameters,
};

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
