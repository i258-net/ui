import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Label } from "@i258/ui";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  argTypes: {
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base UI checkbox is role=checkbox on a non-labelable element — htmlFor alone
// does not create an accessible name. Prefer aria-label or aria-labelledby.
export const Default: Story = {
  args: { "aria-label": "Example checkbox" },
};

export const WithLabel: Story = {
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Checkbox id="terms" aria-labelledby="terms-label" {...args} />
      <Label id="terms-label" htmlFor="terms">
        Accept terms
      </Label>
    </div>
  ),
};

export const Checked: Story = {
  args: { defaultChecked: true, "aria-label": "Checked example" },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
    "aria-label": "Disabled example",
  },
};
