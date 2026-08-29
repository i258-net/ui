import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "@i258/ui";

const meta = {
  title: "Primitives/Alert",
  component: Alert,
  args: {
    title: "Heads up",
    children: "Something needs attention before you continue.",
  },
  parameters: {
    controls: {
      include: ["tone", "title", "children"],
    },
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["info", "success", "warning", "danger"],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: { tone: "info" },
};

export const Success: Story = {
  args: {
    tone: "success",
    title: "Saved",
    children: "Changes are on disk.",
  },
};

export const Warning: Story = {
  args: {
    tone: "warning",
    title: "Stale data",
    children: "Refresh before editing.",
  },
};

export const Danger: Story = {
  args: {
    tone: "danger",
    title: "Load failed",
    children: "Could not reach the register.",
  },
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <Alert tone="info" title="Info">
        Neutral status strip.
      </Alert>
      <Alert tone="success" title="Success">
        Completed cleanly.
      </Alert>
      <Alert tone="warning" title="Warning">
        Proceed with care.
      </Alert>
      <Alert tone="danger" title="Danger">
        Blocking error.
      </Alert>
    </div>
  ),
};
