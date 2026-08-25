import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Choice, ChoiceGroup } from "@i258/ui";

const meta = {
  title: "Primitives/Choice",
  component: ChoiceGroup,
} satisfies Meta<typeof ChoiceGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSelectChip: Story = {
  render: function SingleSelectChipStory() {
    const [value, setValue] = React.useState<string[]>(["open"]);
    return (
      <ChoiceGroup value={value} onValueChange={setValue}>
        <Choice value="all" count={40}>
          All
        </Choice>
        <Choice value="open" count={12}>
          Open
        </Choice>
        <Choice value="blocked" count={3}>
          Blocked
        </Choice>
      </ChoiceGroup>
    );
  },
};

export const MultiSelectChip: Story = {
  render: function MultiSelectChipStory() {
    const [value, setValue] = React.useState<string[]>(["decision", "action"]);
    return (
      <ChoiceGroup multiple value={value} onValueChange={setValue}>
        <Choice value="decision" size="sm" count={4}>
          decision
        </Choice>
        <Choice value="action" size="sm" count={2}>
          action
        </Choice>
        <Choice value="no" size="sm" count={8}>
          no
        </Choice>
        <Choice value="unset" size="sm" count={1}>
          unset
        </Choice>
      </ChoiceGroup>
    );
  },
};

export const OptionList: Story = {
  render: function OptionListStory() {
    const [value, setValue] = React.useState<string[]>([]);
    return (
      <ChoiceGroup
        orientation="vertical"
        value={value}
        onValueChange={setValue}
        style={{ maxWidth: 360 }}
      >
        <Choice variant="option" value="keep">
          Keep current owner and next_action
        </Choice>
        <Choice variant="option" value="reassign">
          Reassign to the domain owner named in the register
        </Choice>
        <Choice variant="option" value="close">
          Mark done — no further work
        </Choice>
      </ChoiceGroup>
    );
  },
};
