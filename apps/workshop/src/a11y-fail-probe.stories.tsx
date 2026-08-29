import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Throwaway probe for I25-153 Phase 2: prove `a11y: { test: "error" }` fails
 * CI. Deliberate axe violation (button with no accessible name). Do not merge.
 */
const meta = {
  title: "Probes/A11yFail",
  tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const EmptyButton: Story = {
  render: () => <button type="button" />,
};
