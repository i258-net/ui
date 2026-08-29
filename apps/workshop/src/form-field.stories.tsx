import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, FormField, Input, Textarea } from "@i258/ui";

const meta = {
  title: "Primitives/FormField",
  component: FormField,
  args: {
    label: "Label",
    children: <Input />,
  },
  parameters: {
    controls: {
      include: ["label", "description", "error", "orientation"],
    },
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInput: Story = {
  args: {
    label: "Search",
    description: "Matches id, title, and body.",
    children: <Input type="search" placeholder="id, title, body…" />,
  },
  render: (args) => <FormField {...args} style={{ minWidth: 280 }} />,
};

export const WithTextarea: Story = {
  args: {
    label: "Notes",
    description: "Shown on the issue detail.",
    children: <Textarea placeholder="Notes…" />,
  },
  render: (args) => <FormField {...args} style={{ minWidth: 280 }} />,
};

export const WithCheckbox: Story = {
  args: {
    label: "Show closed ($0) accounts",
    orientation: "horizontal",
    children: <Checkbox />,
  },
  render: (args) => <FormField {...args} />,
};

export const WithError: Story = {
  args: {
    label: "Email",
    error: "Enter a valid email address.",
    children: <Input type="email" defaultValue="not-an-email" />,
  },
  render: (args) => <FormField {...args} style={{ minWidth: 280 }} />,
};

/** Representative matrix for Playwright VRT (light + dark). */
export const Matrix: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, minWidth: 320 }}>
      <FormField label="Search" description="id, title, body">
        <Input type="search" placeholder="Search…" />
      </FormField>
      <FormField label="Notes">
        <Textarea rows={2} placeholder="Notes…" />
      </FormField>
      <FormField
        label="Show closed accounts"
        orientation="horizontal"
        description="Includes zero-balance rows."
      >
        <Checkbox defaultChecked />
      </FormField>
      <FormField label="Email" error="Enter a valid email address.">
        <Input type="email" defaultValue="not-an-email" />
      </FormField>
    </div>
  ),
};
