import {
  ariaKeyShortcuts,
  Button,
  type CommandItem,
  CommandPalette,
  formatShortcut,
  Kbd,
} from "@i258/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { modKey, withDocumentTheme } from "./document-theme";

/**
 * ⌘K / Ctrl+K from anywhere, text fields included. A modal dialog holding
 * an ARIA 1.2 combobox: focus stays in the search field, ↑/↓ move the
 * active option, Enter runs it, Escape (or the footer's Close) closes. The
 * result count is announced politely. While another dialog or menu is
 * open the shortcut doesn't open it.
 */
const meta = {
  title: "Patterns/CommandPalette",
  component: CommandPalette,
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
  decorators: [withDocumentTheme],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

const Glyph = ({ d }: { d: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d={d} />
  </svg>
);

function useItems(log: (what: string) => void, go: (view: string) => void): CommandItem[] {
  return React.useMemo(
    () => [
      {
        id: "inbox",
        label: "Inbox",
        group: "Go to",
        navigates: true,
        icon: <Glyph d="M2.5 9h3l1 2h3l1-2h3M2.5 9 4 3.5h8L13.5 9v3.5h-11Z" />,
        onSelect: () => go("Inbox"),
      },
      {
        id: "reports",
        label: "Reports",
        group: "Go to",
        navigates: true,
        detail: "2 failing",
        icon: <Glyph d="M3 13V8m5 5V3m5 10V6" />,
        onSelect: () => go("Reports"),
      },
      {
        id: "ledger",
        label: "Ledger",
        group: "Go to",
        keywords: ["abacus", "accounts"],
        navigates: true,
        icon: <Glyph d="M3 3h10v10H3zM3 7h10M7 3v10" />,
        onSelect: () => go("Ledger"),
      },
      {
        id: "new",
        label: "New issue",
        group: "Actions",
        detail: <Kbd>C</Kbd>,
        onSelect: () => log("New issue"),
      },
      {
        id: "sidebar",
        label: "Toggle sidebar",
        group: "Actions",
        detail: <Kbd>{formatShortcut("mod+b")}</Kbd>,
        onSelect: () => log("Toggle sidebar"),
      },
      {
        id: "theme",
        label: "Switch theme",
        group: "Actions",
        keywords: ["dark", "light"],
        onSelect: () => log("Switch theme"),
      },
      ...[
        "X-19 Parser drops trailing fields",
        "X-41 Duplicate ledger rows",
        "X-66 Stale freshness line",
      ].map((label) => ({
        id: label.slice(0, 4),
        label,
        group: "Issues",
        navigates: true,
        onSelect: () => go(label.slice(0, 4)),
      })),
    ],
    [log, go],
  );
}

/**
 * The app owns `open` and the destination; when a command navigates, it
 * moves focus to the new view's heading itself.
 */
function PaletteDemo({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = React.useState(initialOpen);
  const [last, setLast] = React.useState("none");
  const [view, setView] = React.useState("Inbox");
  const [focusHeading, setFocusHeading] = React.useState(false);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const log = React.useCallback((what: string) => setLast(what), []);
  const go = React.useCallback((to: string) => {
    setView(to);
    setFocusHeading(true);
  }, []);
  React.useEffect(() => {
    if (!focusHeading || open) return;
    heading.current?.focus();
    setFocusHeading(false);
  }, [focusHeading, open]);
  const items = useItems(log, go);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        aria-keyshortcuts={ariaKeyShortcuts("mod+k")}
      >
        Search
        <Kbd aria-hidden="true">{formatShortcut("mod+k")}</Kbd>
      </Button>
      <h1 ref={heading} tabIndex={-1} style={{ margin: 0, fontSize: "var(--i258-text-xl)" }}>
        {view}
      </h1>
      <label style={{ display: "grid", gap: 4 }}>
        Note
        <input data-testid="note" />
      </label>
      <p style={{ margin: 0 }}>
        Ran: <output data-testid="ran">{last}</output>
      </p>
      <CommandPalette open={open} onOpenChange={setOpen} items={items} />
    </div>
  );
}

/**
 * ⌘K opens it from a text field, typing filters and announces the count,
 * ↓ + Enter runs an action, and focus goes back to where it was.
 */
export const Default: Story = {
  args: { open: false, onOpenChange: () => {}, items: [] },
  render: () => <PaletteDemo />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const mod = modKey();
    const note = c.getByTestId("note");
    await userEvent.click(note);
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);

    const dialog = await body().findByRole("dialog", {
      name: "Command palette",
    });
    const input = body().getByRole("combobox", { name: "Search commands" });
    await waitFor(() => expect(input).toHaveFocus());
    const listbox = body().getByRole("listbox");
    await expect(input).toHaveAttribute("aria-controls", listbox.id);
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(body().getAllByRole("option")).toHaveLength(9);
    await expect(body().getByRole("group", { name: "Go to" })).toBeInTheDocument();
    // The first option is active.
    const first = body().getByRole("option", { name: "Inbox" });
    await expect(input).toHaveAttribute("aria-activedescendant", first.id);
    await expect(first).toHaveAttribute("aria-selected", "true");

    // Typing filters (label, group and hidden keywords) and announces it.
    await userEvent.type(input, "toggle");
    await expect(body().getAllByRole("option")).toHaveLength(1);
    await expect(within(dialog).getByRole("status")).toHaveTextContent("1 result");
    await userEvent.clear(input);
    await userEvent.type(input, "act");
    await expect(within(dialog).getByRole("status")).toHaveTextContent("3 results");

    // Arrows wrap; Enter runs the active option and closes.
    await userEvent.keyboard("{ArrowUp}");
    const theme = body().getByRole("option", { name: "Switch theme" });
    await expect(input).toHaveAttribute("aria-activedescendant", theme.id);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect(input).toHaveAttribute(
      "aria-activedescendant",
      body().getByRole("option", { name: "Toggle sidebar" }).id,
    );
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(c.getByTestId("ran")).toHaveTextContent("Toggle sidebar");
    await expect(note).toHaveFocus();

    // It reopens empty.
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);
    const again = await body().findByRole("combobox", {
      name: "Search commands",
    });
    await expect(again).toHaveValue("");
    // ⌘K again (from inside) closes it; so does Escape.
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);
    await body().findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(note).toHaveFocus();
  },
};

/**
 * A command that navigates leaves focus to the app, which puts it on the
 * new view's heading. Hidden keywords match ("abacus" finds Ledger).
 */
export const Navigates: Story = {
  args: { open: false, onOpenChange: () => {}, items: [] },
  render: () => <PaletteDemo />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Search" }));
    const input = await body().findByRole("combobox", {
      name: "Search commands",
    });
    await waitFor(() => expect(input).toHaveFocus());
    await userEvent.type(input, "abacus");
    await expect(
      body()
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Ledger"]);
    await userEvent.click(body().getByRole("option", { name: "Ledger" }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    const heading = c.getByRole("heading", { level: 1 });
    await expect(heading).toHaveTextContent("Ledger");
    await waitFor(() => expect(heading).toHaveFocus());

    // Reopened by shortcut and dismissed: focus goes back to the heading,
    // not left behind by the earlier navigation.
    const mod = modKey();
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);
    await waitFor(() => expect(body().getByRole("combobox")).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(heading).toHaveFocus());
  },
};

/** Nothing matches: the empty line shows, the status says so. */
export const NoResults: Story = {
  name: "No results",
  args: { open: false, onOpenChange: () => {}, items: [] },
  render: () => <PaletteDemo initialOpen />,
  play: async () => {
    const input = await body().findByRole("combobox", {
      name: "Search commands",
    });
    await userEvent.type(input, "zzz");
    await expect(body().queryAllByRole("option")).toHaveLength(0);
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await expect(within(body().getByRole("dialog")).getByRole("status")).toHaveTextContent(
      "No matches",
    );
    await userEvent.keyboard("{Enter}");
    await expect(body().getByRole("dialog")).toBeInTheDocument();
  },
};

function InterleavedDemo() {
  const [open, setOpen] = React.useState(true);
  const [last, setLast] = React.useState("none");
  const items = React.useMemo<CommandItem[]>(
    () =>
      (
        [
          ["a", "Alpha", "Files"],
          ["b", "Bravo", "Views"],
          ["c", "Charlie", "Files"],
          ["d", "Delta", "Views"],
        ] as const
      ).map(([id, label, group]) => ({
        id,
        label,
        group,
        onSelect: () => setLast(label),
      })),
    [],
  );
  return (
    <>
      <p style={{ margin: 0 }}>
        Ran: <output data-testid="ran">{last}</output>
      </p>
      <CommandPalette open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}

/**
 * Items whose groups interleave (Files, Views, Files, Views) show grouped,
 * and ↑/↓, Ctrl+Home / Ctrl+End and Enter follow what's shown.
 */
export const InterleavedGroups: Story = {
  name: "Interleaved groups",
  args: { open: false, onOpenChange: () => {}, items: [] },
  render: () => <InterleavedDemo />,
  play: async ({ canvasElement }) => {
    const input = await body().findByRole("combobox", {
      name: "Search commands",
    });
    await waitFor(() => expect(input).toHaveFocus());
    const shown = body().getAllByRole("option");
    await expect(shown.map((o) => o.textContent)).toEqual(["Alpha", "Charlie", "Bravo", "Delta"]);
    const active = () => input.getAttribute("aria-activedescendant");
    await expect(active()).toBe(shown[0]!.id);
    await userEvent.keyboard("{ArrowDown}");
    await expect(active()).toBe(shown[1]!.id);
    await expect(shown[1]).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowDown}");
    await expect(active()).toBe(shown[2]!.id);
    await userEvent.keyboard("{Control>}{End}{/Control}");
    await expect(active()).toBe(shown[3]!.id);
    await userEvent.keyboard("{Control>}{Home}{/Control}");
    await expect(active()).toBe(shown[0]!.id);
    await expect(shown[0]).toHaveTextContent("Alpha");
    await userEvent.keyboard("{Control>}{End}{/Control}");
    await expect(active()).toBe(shown[3]!.id);
    await userEvent.keyboard("{ArrowDown}");
    await expect(active()).toBe(shown[0]!.id);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await expect(active()).toBe(shown[2]!.id);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(within(canvasElement).getByTestId("ran")).toHaveTextContent("Bravo");
  },
};

/** Open, for the a11y check and VRT. */
export const Open: Story = {
  args: { open: false, onOpenChange: () => {}, items: [] },
  render: () => <PaletteDemo initialOpen />,
  play: async () => {
    const input = await body().findByRole("combobox", {
      name: "Search commands",
    });
    await waitFor(() => expect(input).toHaveFocus());
  },
};
