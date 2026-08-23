import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "@i258/ui";

const meta = {
  title: "Primitives/Link",
  component: Link,
  args: {
    children: "Example link",
    href: "#",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["accent", "muted", "subtle"],
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {
  args: { variant: "accent" },
};

export const Muted: Story = {
  args: { variant: "muted" },
};

export const Subtle: Story = {
  args: { variant: "subtle" },
};

export const InCopy: Story = {
  render: () => (
    <p
      style={{
        maxWidth: 420,
        fontFamily: "var(--i258-font-sans)",
        fontSize: 15,
        lineHeight: 1.5,
        margin: 0,
      }}
    >
      Read the{" "}
      <Link href="#" variant="accent">
        design system vision
      </Link>{" "}
      or browse{" "}
      <Link href="#" variant="muted">
        related notes
      </Link>
      .
    </p>
  ),
};
