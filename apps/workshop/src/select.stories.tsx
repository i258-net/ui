import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { FormField, Select } from "@i258/ui";

/**
 * A native `<select>`: the platform's picker and keyboard, forced-colours
 * support, no portal. A 3:1 edge like every control. Inside FormField it
 * gets its label, description and error.
 */
const meta = {
  title: "Primitives/Select",
  component: Select,
  parameters: {
    controls: { include: ["size", "disabled"] },
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const Options = () => (
  <>
    <option value="id">Id</option>
    <option value="updated">Last updated</option>
    <option value="priority">Priority</option>
  </>
);

export const Default: Story = {
  render: (args) => (
    <Select aria-label="Sort by" defaultValue="updated" {...args}>
      <Options />
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const select = c.getByRole("combobox", { name: "Sort by" });
    await expect(select).toHaveValue("updated");
    await userEvent.selectOptions(select, "priority");
    await expect(select).toHaveValue("priority");
    // The chevron is decoration.
    const chevron = canvasElement.querySelector(".i258-select__chevron");
    await expect(chevron).toHaveAttribute("aria-hidden", "true");
  },
};

/** Label, description and error through FormField; it stays uncontrolled. */
export const InFormField: Story = {
  render: function InFormField() {
    const [changes, setChanges] = React.useState(0);
    return (
      <div style={{ display: "grid", gap: 16, width: 280 }}>
        <FormField label="Group by" description="Rows are grouped under a header per value.">
          <Select defaultValue="none" onChange={() => setChanges((n) => n + 1)}>
            <option value="none">None</option>
            <option value="status">Status</option>
            <option value="owner">Owner</option>
          </Select>
        </FormField>
        <FormField label="Project" error="Choose a project.">
          <Select defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            <option value="honeycomb">Honeycomb</option>
            <option value="abacus">Abacus</option>
          </Select>
        </FormField>
        <p style={{ margin: 0 }}>
          Changes: <output data-testid="changes">{changes}</output>
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const group = c.getByRole("combobox", { name: "Group by" });
    await expect(group).toHaveAccessibleDescription("Rows are grouped under a header per value.");
    await userEvent.selectOptions(group, "owner");
    await expect(group).toHaveValue("owner");
    await expect(c.getByTestId("changes")).toHaveTextContent("1");

    const project = c.getByRole("combobox", { name: "Project" });
    await expect(project).toHaveAttribute("aria-invalid", "true");
    await expect(project).toHaveAccessibleDescription("Choose a project.");
    // The edge turns danger.
    await expect(getComputedStyle(project).borderTopColor).not.toBe(getComputedStyle(group).borderTopColor);

    // Clicking the label focuses the control.
    await userEvent.click(c.getByText("Group by"));
    await expect(group).toHaveFocus();
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Select key={size} size={size} aria-label={`Sort (${size})`} defaultValue="id">
          <Options />
        </Select>
      ))}
      <Select aria-label="Sort (disabled)" disabled defaultValue="id">
        <Options />
      </Select>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const h = (n: string) => c.getByRole("combobox", { name: n }).getBoundingClientRect().height;
    await expect(h("Sort (sm)")).toBeLessThan(h("Sort (md)"));
    await expect(h("Sort (md)")).toBeLessThan(h("Sort (lg)"));
    await expect(c.getByRole("combobox", { name: "Sort (disabled)" })).toBeDisabled();
  },
};

/** `className` sizes the wrapper; the select fills it. */
export const FullWidth: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Select aria-label="Sort by" className="full" defaultValue="id">
        <Options />
      </Select>
      <style>{`.full { display: flex; width: 100%; }`}</style>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const select = within(canvasElement).getByRole("combobox", { name: "Sort by" });
    await expect(Math.round(select.getBoundingClientRect().width)).toBe(320);
  },
};
