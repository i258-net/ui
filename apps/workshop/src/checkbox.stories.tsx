import { Checkbox, Label } from "@i258/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
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

/*
  Checkboxes as close as list screens put them: side by side at a 12px gap
  (the themes row story) and stacked with no gap at all, each with a real
  associated label. vrt/checkbox-activation.spec.ts clicks this story's
  visible edges and target margins under both box-sizing models, both
  densities and both pointer types, and checks only the intended box changes.
*/
function CloseSpacingLayout({ native = false }: { native?: boolean }) {
  // The supported native-button form: Base UI puts `disabled` on the button
  // and leaves keyboard activation to it.
  const as = native ? { render: <button type="button" />, nativeButton: true } : {};
  return (
    <div data-testid="close-spacing" style={{ display: "grid", gap: 24 }}>
      <div data-testid="row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Checkbox {...as} id="row-a" aria-label="Row A" />
        <Checkbox {...as} id="row-b" aria-label="Row B" defaultChecked />
        <Checkbox {...as} id="row-c" aria-label="Row C" />
        <Checkbox {...as} id="row-mixed" aria-label="Row mixed" indeterminate />
        <Checkbox {...as} id="row-disabled" aria-label="Row disabled" disabled />
      </div>
      <div data-testid="labelled-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Checkbox {...as} id="lr-a" />
        <Label htmlFor="lr-a">Alpha</Label>
        <Checkbox {...as} id="lr-b" />
        <Label htmlFor="lr-b">Beta</Label>
      </div>
      <div
        data-testid="stack"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        {["One", "Two", "Three"].map((name) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Checkbox {...as} id={`stack-${name}`} />
            <Label htmlFor={`stack-${name}`}>{name}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CloseSpacing: Story = {
  parameters: { controls: { disable: true } },
  render: () => <CloseSpacingLayout />,
};

/* The same layout with `render={<button />} nativeButton`. The root is a real
   <button>, so its UA border, padding, background and appearance must not
   add to the target or paint round the drawn box. */
export const CloseSpacingNativeButton: Story = {
  parameters: { controls: { disable: true } },
  render: () => <CloseSpacingLayout native />,
};
