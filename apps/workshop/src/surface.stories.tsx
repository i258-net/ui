import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, Button, Surface } from "@i258/ui";

const meta = {
  title: "Primitives/Surface",
  component: Surface,
  args: {
    children: "Surface content",
  },
  parameters: {
    controls: {
      include: ["children", "variant", "padding"],
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "raised", "inset"],
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
    asChild: { table: { disable: true } },
    render: { table: { disable: true } },
  },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "default", padding: "md" },
};

export const Raised: Story = {
  args: { variant: "raised", padding: "md" },
};

export const Inset: Story = {
  args: { variant: "inset", padding: "md" },
};

export const Composition: Story = {
  render: () => (
    <Surface variant="raised" padding="lg" style={{ maxWidth: 360 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong>Baseline card</strong>
          <Badge variant="accent">demo</Badge>
        </div>
        <p style={{ margin: 0, color: "var(--i258-muted)", fontSize: 14 }}>
          Surface is the composition shell — padding and elevation only; content
          stays with the consumer.
        </p>
        <Button size="sm">Action</Button>
      </div>
    </Surface>
  ),
};
