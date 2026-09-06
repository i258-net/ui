import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Checkbox, Label } from "@i258/ui";
import { chromaticPilotParameters } from "../.storybook/modes";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  parameters: {
    controls: {
      include: ["checked", "disabled", "defaultChecked"],
    },
  },
  argTypes: {
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { "aria-label": "Example checkbox" },
};

export const WithLabel: Story = {
  parameters: chromaticPilotParameters,
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
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", {
      name: "Disabled example",
    });
    // Base UI renders a <span role="checkbox">, so `disabled` is not a real
    // attribute here — the disabled state has to reach AT as aria-disabled.
    await expect(box).toHaveAttribute("aria-disabled", "true");
    await expect(box).not.toHaveAttribute("disabled");
  },
};

// Regression: the kit used to pass nativeButton={true} to a Base UI root that
// renders a <span>, which turned off the non-native keyboard path — the span
// took focus but Space did nothing. dotbuzz#451.
export const KeyboardToggle: Story = {
  args: { "aria-label": "Keyboard example" },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", {
      name: "Keyboard example",
    });

    await userEvent.tab();
    await expect(box).toHaveFocus();
    await expect(box).toHaveAttribute("aria-checked", "false");

    await userEvent.keyboard(" ");
    await expect(box).toHaveAttribute("aria-checked", "true");

    await userEvent.keyboard(" ");
    await expect(box).toHaveAttribute("aria-checked", "false");
  },
};

// Regression: with nativeButton={true} the consumer-supplied id landed on the
// span rather than the hidden input, so a plain <Label htmlFor> named nothing
// and clicking it toggled nothing.
export const LabelAssociation: Story = {
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Checkbox id="newsletter" {...args} />
      <Label htmlFor="newsletter">Send me the newsletter</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox", {
      name: "Send me the newsletter",
    });
    await expect(box).toHaveAttribute("aria-checked", "false");

    await userEvent.click(canvas.getByText("Send me the newsletter"));
    await expect(box).toHaveAttribute("aria-checked", "true");
  },
};
