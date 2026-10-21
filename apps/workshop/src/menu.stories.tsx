import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Kbd,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
  ariaKeyShortcuts,
  formatShortcut,
} from "@i258/ui";

import { withDocumentTheme } from "./document-theme";

/**
 * A menu button on Base UI: Enter, Space or ↓ opens it with the first item
 * focused, ↑/↓ and Home/End move, a letter jumps to the item it starts,
 * Escape closes and returns focus to the trigger. Checkbox and radio items
 * stay open so several can be set in one visit; options draw their box
 * either way, so state isn't the tick alone.
 */
const meta = {
  title: "Primitives/Menu",
  component: Menu,
  decorators: [withDocumentTheme],
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

const ArchiveIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="12" height="3" rx="1" />
    <path d="M3 6v6.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6M6.5 9h3" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
    <path d="M10.5 5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1H5" />
  </svg>
);

function Actions({
  defaultOpen,
  onAction = () => {},
}: {
  defaultOpen?: boolean;
  onAction?: (what: string) => void;
}) {
  return (
    <Menu defaultOpen={defaultOpen}>
      <MenuTrigger render={<Button variant="secondary" />}>Actions</MenuTrigger>
      <MenuContent>
        <MenuItem
          icon={<CopyIcon />}
          aria-keyshortcuts={ariaKeyShortcuts("mod+shift+c", false)}
          trailing={<Kbd>{formatShortcut("mod+shift+c", false)}</Kbd>}
          onClick={() => onAction("Copy link")}
        >
          Copy link
        </MenuItem>
        <MenuItem icon={<ArchiveIcon />} onClick={() => onAction("Archive")}>
          Archive
        </MenuItem>
        <MenuItem disabled>Move to project</MenuItem>
        <MenuSeparator />
        <MenuItem onClick={() => onAction("Delete")}>Delete…</MenuItem>
      </MenuContent>
    </Menu>
  );
}

/** Keyboard path: open, move, run, focus back on the trigger. */
export const Default: Story = {
  render: function Default() {
    const [last, setLast] = React.useState("none");
    return (
      <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
        <Actions onAction={setLast} />
        <p style={{ margin: 0 }}>
          Ran: <output data-testid="ran">{last}</output>
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const trigger = c.getByRole("button", { name: "Actions" });
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await body().findByRole("menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const copy = body().getByRole("menuitem", { name: "Copy link" });
    await waitFor(() => expect(copy).toHaveFocus());
    // The key cap is a hint, not part of the name.
    await expect(copy).toHaveAttribute("aria-keyshortcuts", "Control+Shift+C");

    await userEvent.keyboard("{ArrowDown}");
    await expect(body().getByRole("menuitem", { name: "Archive" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(body().getByRole("menuitem", { name: "Delete…" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(copy).toHaveFocus();
    await userEvent.keyboard("a");
    await expect(body().getByRole("menuitem", { name: "Archive" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(menu).not.toBeInTheDocument());
    await expect(c.getByTestId("ran")).toHaveTextContent("Archive");
    await expect(trigger).toHaveFocus();

    // Escape closes without running anything.
    await userEvent.keyboard("{ArrowDown}");
    await body().findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(c.getByTestId("ran")).toHaveTextContent("Archive");
  },
};

/** Open, for the a11y check and VRT. */
export const Open: Story = {
  render: () => <Actions defaultOpen />,
  play: async () => {
    await body().findByRole("menu");
  },
};

function FilterMenu({ defaultOpen }: { defaultOpen?: boolean }) {
  const [status, setStatus] = React.useState<string[]>(["open"]);
  const [sort, setSort] = React.useState("updated");
  const toggle = (value: string) => (on: boolean) =>
    setStatus((s) => (on ? [...s, value] : s.filter((v) => v !== value)));
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <Menu defaultOpen={defaultOpen}>
        <MenuTrigger render={<Button variant="secondary" />}>Filter</MenuTrigger>
        <MenuContent>
          <MenuGroup>
            <MenuGroupLabel>Status</MenuGroupLabel>
            {(["open", "blocked", "done"] as const).map((v) => (
              <MenuCheckboxItem
                key={v}
                checked={status.includes(v)}
                onCheckedChange={toggle(v)}
                trailing={{ open: 31, blocked: 4, done: 112 }[v]}
              >
                {v[0]!.toUpperCase() + v.slice(1)}
              </MenuCheckboxItem>
            ))}
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup>
            <MenuGroupLabel>Sort by</MenuGroupLabel>
            <MenuRadioGroup value={sort} onValueChange={setSort}>
              <MenuRadioItem value="updated">Last updated</MenuRadioItem>
              <MenuRadioItem value="priority">Priority</MenuRadioItem>
            </MenuRadioGroup>
          </MenuGroup>
        </MenuContent>
      </Menu>
      <p style={{ margin: 0 }}>
        Status: <output data-testid="status">{status.join(", ") || "any"}</output> · Sort:{" "}
        <output data-testid="sort">{sort}</output>
      </p>
    </div>
  );
}

/** Checkbox items toggle and stay open; radio items pick one. */
export const Options: Story = {
  name: "Checkbox and radio items",
  render: () => <FilterMenu />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Filter" }));
    const menu = await body().findByRole("menu");
    const open = body().getByRole("menuitemcheckbox", { name: "Open" });
    const blocked = body().getByRole("menuitemcheckbox", { name: "Blocked" });
    await expect(open).toHaveAttribute("aria-checked", "true");
    await expect(blocked).toHaveAttribute("aria-checked", "false");
    await expect(body().getByRole("group", { name: "Status" })).toContainElement(open);

    await userEvent.click(blocked);
    await expect(blocked).toHaveAttribute("aria-checked", "true");
    await expect(menu).toBeInTheDocument();
    blocked.focus();
    await userEvent.keyboard(" ");
    await expect(blocked).toHaveAttribute("aria-checked", "false");
    await expect(c.getByTestId("status")).toHaveTextContent("open");

    const priority = body().getByRole("menuitemradio", { name: "Priority" });
    await userEvent.click(priority);
    await expect(c.getByTestId("sort")).toHaveTextContent("priority");
    await expect(priority).toHaveAttribute("aria-checked", "true");
    await expect(body().getByRole("menuitemradio", { name: "Last updated" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    // Options stay open (Base UI's default) until Escape or a click outside.
    await expect(menu).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(c.getByRole("button", { name: "Filter" })).toHaveFocus();
  },
};

/** Open with options, for the a11y check and VRT. */
export const OptionsOpen: Story = {
  name: "Checkbox and radio items (open)",
  render: () => <FilterMenu defaultOpen />,
  play: async () => {
    await body().findByRole("menu");
  },
};
