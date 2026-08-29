import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Disclosure, DisclosurePanel, DisclosureTrigger } from "@i258/ui";

const meta = {
  title: "Primitives/Disclosure",
  component: Disclosure,
  parameters: {
    controls: {
      include: ["open", "defaultOpen", "disabled"],
    },
  },
  argTypes: {
    open: { control: "boolean" },
    defaultOpen: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  render: () => (
    <Disclosure>
      <DisclosureTrigger>Pending PRs</DisclosureTrigger>
      <DisclosurePanel>
        Three open pull requests waiting on review.
      </DisclosurePanel>
    </Disclosure>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Disclosure defaultOpen>
      <DisclosureTrigger>Issue body</DisclosureTrigger>
      <DisclosurePanel>
        Markdown and structured sections live in the app; this panel is the
        chrome.
      </DisclosurePanel>
    </Disclosure>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [open, setOpen] = React.useState(false);
    return (
      <Disclosure open={open} onOpenChange={setOpen}>
        <DisclosureTrigger>
          {open ? "Hide details" : "Show details"}
        </DisclosureTrigger>
        <DisclosurePanel keepMounted>
          Controlled open state for app-driven expand/collapse.
        </DisclosurePanel>
      </Disclosure>
    );
  },
};
