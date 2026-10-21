import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Checkbox,
  FormField,
  Input,
  Kbd,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  ShortcutsProvider,
  ariaKeyShortcuts,
  formatShortcut,
  useShortcut,
  useSingleKeyShortcuts,
} from "@i258/ui";

import { modKey, withDocumentTheme } from "./document-theme";

/**
 * `useShortcut(binding, handler, options?)` with the shared rules (I25-119):
 *
 * - **Character keys are opt-in.** `1`, `u`, `?` fire only inside
 *   `ShortcutsProvider singleKeyShortcuts` — wire it to the app's Settings
 *   on/off control. Modifier chords (⌘K) and named keys (Enter, Escape)
 *   work without it.
 * - **Typing and popups are guarded.** Nothing fires from a text field
 *   unless the binding passes `allowInInput` (a character key never does),
 *   or while a dialog / menu / listbox is open unless it passes
 *   `allowInLayer`.
 * - **A focused control keeps its keys.** Enter on a button presses the
 *   button.
 * - **Enter confirms.** No "press it twice" bindings and no auto-repeat:
 *   pressing the same number again never confirms.
 *
 * Every shortcut also needs a visible control that does the same thing.
 */
const meta = {
  title: "Patterns/useShortcut",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
  decorators: [withDocumentTheme],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clicking or pressing a key: either way the last action is written here. */
function useLog() {
  const [last, setLast] = React.useState("Nothing yet");
  const [count, setCount] = React.useState(0);
  const log = (what: string) => {
    setLast(what);
    setCount((n) => n + 1);
  };
  const output = (
    <p style={{ margin: 0 }}>
      Last action:{" "}
      <output data-testid="last" data-count={count}>
        {last}
      </output>
    </p>
  );
  return { log, output };
}

/** A visible action button with its key cap, shown only while the key works. */
function ActionButton({
  binding,
  onClick,
  children,
}: {
  binding: string;
  onClick: () => void;
  children: string;
}) {
  const singleKeys = useSingleKeyShortcuts();
  const character = binding.length === 1;
  const live = !character || singleKeys;
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      aria-keyshortcuts={live ? ariaKeyShortcuts(binding) : undefined}
    >
      {children}
      {live ? <Kbd aria-hidden="true">{formatShortcut(binding)}</Kbd> : null}
    </Button>
  );
}

function Workbench() {
  const { log, output } = useLog();
  useShortcut("u", () => log("Undo"));
  useShortcut("mod+b", () => log("Toggle sidebar"));
  useShortcut("mod+k", () => log("Search"), { allowInInput: true });
  // A page-level Enter (open the selected row): a focused button keeps it.
  useShortcut("Enter", () => log("Open selected"));
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <ActionButton binding="u" onClick={() => log("Undo")}>
          Undo
        </ActionButton>
        <ActionButton binding="mod+b" onClick={() => log("Toggle sidebar")}>
          Toggle sidebar
        </ActionButton>
        <ActionButton binding="mod+k" onClick={() => log("Search")}>
          Search
        </ActionButton>
        <Menu>
          <MenuTrigger render={<Button variant="secondary" />}>More</MenuTrigger>
          <MenuContent>
            <MenuItem onClick={() => log("Archive")}>Archive</MenuItem>
          </MenuContent>
        </Menu>
      </div>
      <FormField label="Note">
        <Input />
      </FormField>
      {output}
    </div>
  );
}

function SettingsDemo({ initial = false }: { initial?: boolean }) {
  const [singleKeys, setSingleKeys] = React.useState(initial);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormField label="Single-key shortcuts" orientation="horizontal">
        <Checkbox checked={singleKeys} onCheckedChange={(v) => setSingleKeys(v === true)} />
      </FormField>
      <ShortcutsProvider singleKeyShortcuts={singleKeys}>
        <Workbench />
      </ShortcutsProvider>
    </div>
  );
}

const press = (keys: string) => userEvent.keyboard(keys);
const blur = () => (document.activeElement as HTMLElement | null)?.blur();

/**
 * Off by default: `u` does nothing and shows no key cap, while ⌘K / Ctrl+K
 * and ⌘B / Ctrl+B work. Turning the setting on brings `u` and its cap back.
 */
export const SettingsSwitch: Story = {
  name: "Settings switch (single keys opt-in)",
  render: () => <SettingsDemo />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const last = c.getByTestId("last");
    const mod = modKey();
    blur();

    await press("u");
    await expect(last).toHaveTextContent("Nothing yet");
    await expect(c.getByRole("button", { name: "Undo" })).not.toHaveAttribute("aria-keyshortcuts");
    await expect(c.getByRole("button", { name: "Undo" }).querySelector("kbd")).toBeNull();

    await press(`{${mod}>}b{/${mod}}`);
    await expect(last).toHaveTextContent("Toggle sidebar");
    await expect(c.getByRole("button", { name: "Toggle sidebar" })).toHaveAttribute(
      "aria-keyshortcuts",
      mod === "Meta" ? "Meta+B" : "Control+B",
    );

    await userEvent.click(c.getByRole("checkbox", { name: "Single-key shortcuts" }));
    blur();
    await press("u");
    await expect(last).toHaveTextContent("Undo");
    await expect(c.getByRole("button", { name: "Undo" })).toHaveAttribute("aria-keyshortcuts", "U");

    // Back off: the key is released again.
    await userEvent.click(c.getByRole("checkbox", { name: "Single-key shortcuts" }));
    await press(`{${mod}>}b{/${mod}}`);
    blur();
    await press("u");
    await expect(last).toHaveTextContent("Toggle sidebar");
  },
};

/**
 * Typing is never hijacked and an open menu owns the keyboard, even with
 * single keys on. ⌘K opts in to firing from a text field.
 */
export const Guards: Story = {
  name: "Typing and popup guards",
  render: () => <SettingsDemo initial />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const last = c.getByTestId("last");
    const mod = modKey();

    // In a text field: `u` types, ⌘B stays the field's, ⌘K (allowInInput) runs.
    const note = c.getByRole("textbox", { name: "Note" });
    await userEvent.click(note);
    await press("u");
    await expect(note).toHaveValue("u");
    await press(`{${mod}>}b{/${mod}}`);
    await expect(last).toHaveTextContent("Nothing yet");
    await press(`{${mod}>}k{/${mod}}`);
    await expect(last).toHaveTextContent("Search");

    // Enter with nothing focused is the page's; on a focused button it
    // presses that button, and the page's Enter doesn't also run.
    blur();
    await press("{Enter}");
    await expect(last).toHaveTextContent("Open selected");
    c.getByRole("button", { name: "Undo" }).focus();
    await press("{Enter}");
    await expect(last).toHaveTextContent("Undo");
    await expect(last).toHaveAttribute("data-count", "3");

    // An open menu owns the keyboard: `u` and ⌘B do nothing.
    await userEvent.click(c.getByRole("button", { name: "More" }));
    const menu = await within(document.body).findByRole("menu");
    await waitFor(() => expect(menu).toContainElement(document.activeElement as HTMLElement));
    await press("u");
    await press(`{${mod}>}b{/${mod}}`);
    await expect(last).toHaveAttribute("data-count", "3");
    await press("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());

    // Closed again: keys are back.
    blur();
    await press("u");
    await expect(last).toHaveAttribute("data-count", "4");
  },
};

const STANCES = [
  { key: "1", label: "Approve" },
  { key: "2", label: "Reject" },
  { key: "3", label: "Modify" },
] as const;

/**
 * Number keys pick a stance; Enter confirms it, Escape backs out. Pressing
 * the same number again only picks it again. Each stance is also a visible
 * button, and a Confirm button does what Enter does.
 */
function Triage() {
  const singleKeys = useSingleKeyShortcuts();
  const [pending, setPending] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState<string[]>([]);
  // A stance picked by click hands focus to Confirm, so the next Enter
  // confirms rather than pressing the stance button again.
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const [focusConfirm, setFocusConfirm] = React.useState(false);
  React.useEffect(() => {
    if (!focusConfirm) return;
    confirmRef.current?.focus();
    setFocusConfirm(false);
  }, [focusConfirm]);
  const confirm = () => {
    if (!pending) return;
    setConfirmed((c) => [...c, pending]);
    setPending(null);
  };
  useShortcut(
    STANCES.map((s) => s.key),
    (e) => setPending(STANCES.find((s) => s.key === e.key)!.label),
  );
  useShortcut("Enter", confirm, { enabled: pending != null });
  useShortcut("Escape", () => setPending(null), { enabled: pending != null });
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
      <div role="group" aria-label="Stance" style={{ display: "flex", gap: 8 }}>
        {STANCES.map((s) => (
          <Button
            key={s.key}
            variant={pending === s.label ? "primary" : "secondary"}
            aria-pressed={pending === s.label}
            aria-keyshortcuts={singleKeys ? s.key : undefined}
            onClick={() => {
              setPending(s.label);
              setFocusConfirm(true);
            }}
          >
            {s.label}
            {singleKeys ? <Kbd aria-hidden="true">{s.key}</Kbd> : null}
          </Button>
        ))}
      </div>
      <p style={{ margin: 0 }} role="status" data-testid="prompt">
        {pending ? `${pending} — press Enter to confirm, Escape to back out.` : "Pick a stance."}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <Button ref={confirmRef} disabled={!pending} onClick={confirm} aria-keyshortcuts="Enter">
          Confirm
        </Button>
      </div>
      <p style={{ margin: 0 }}>
        Confirmed: <output data-testid="confirmed">{confirmed.join(", ") || "none"}</output>
      </p>
    </div>
  );
}

export const EnterConfirms: Story = {
  name: "Enter confirms; same number again never does",
  render: () => (
    <ShortcutsProvider singleKeyShortcuts>
      <Triage />
    </ShortcutsProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const confirmed = c.getByTestId("confirmed");
    blur();

    await press("1");
    await expect(c.getByRole("button", { name: "Approve" })).toHaveAttribute("aria-pressed", "true");
    await press("1");
    await press("1");
    await expect(confirmed).toHaveTextContent("none");
    await expect(c.getByRole("button", { name: "Approve" })).toHaveAttribute("aria-pressed", "true");

    // Held down: auto-repeat never fires a binding.
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "2", repeat: true, bubbles: true }));
    await expect(c.getByRole("button", { name: "Approve" })).toHaveAttribute("aria-pressed", "true");

    await press("2");
    await expect(c.getByRole("button", { name: "Reject" })).toHaveAttribute("aria-pressed", "true");
    await press("{Escape}");
    await expect(c.getByTestId("prompt")).toHaveTextContent("Pick a stance.");
    await press("{Enter}");
    await expect(confirmed).toHaveTextContent("none");

    await press("3");
    await press("{Enter}");
    await expect(confirmed).toHaveTextContent("Modify");

    // The visible path does the same: click a stance, click Confirm.
    await userEvent.click(c.getByRole("button", { name: "Approve" }));
    await userEvent.click(c.getByRole("button", { name: "Confirm" }));
    await expect(confirmed).toHaveTextContent("Modify, Approve");

    // Click a stance, then Enter: focus moved to Confirm, so Enter confirms.
    await userEvent.click(c.getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(c.getByRole("button", { name: "Confirm" })).toHaveFocus());
    await press("{Enter}");
    await expect(confirmed).toHaveTextContent("Modify, Approve, Reject");
  },
};

function QueueList({ role = "listbox" }: { role?: "listbox" | "treegrid" }) {
  const { log, output } = useLog();
  const [active, setActive] = React.useState(0);
  const rows = ["X-19", "X-41", "X-66"];
  useShortcut("u", () => log("Undo"));
  // A page-level ↓ the focused list must keep for itself.
  useShortcut("ArrowDown", () => log("Next view"));
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
      <div
        role={role}
        aria-label="Queue"
        tabIndex={0}
        aria-activedescendant={`q-${active}`}
        // No preventDefault: the hook has to see ↓ belongs to the list.
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((i) => Math.min(rows.length - 1, i + 1));
        }}
        style={{ border: "1px solid var(--i258-border-strong)", borderRadius: 8, padding: 4 }}
      >
        {rows.map((r, i) => (
          <div
            key={r}
            id={`q-${i}`}
            role={role === "treegrid" ? "row" : "option"}
            aria-selected={i === active}
            style={{ padding: 4 }}
          >
            {role === "treegrid" ? <span role="gridcell">{r}</span> : r}
          </div>
        ))}
      </div>
      {output}
    </div>
  );
}

function TagList() {
  const { log, output } = useLog();
  const [active, setActive] = React.useState(0);
  const [picked, setPicked] = React.useState<readonly number[]>([]);
  const tags = ["Parser", "Ledger", "Freshness"];
  // A page-level Space the focused list must keep for itself.
  useShortcut("Space", () => log("Play/pause"));
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
      <div
        role="listbox"
        aria-label="Tags"
        aria-multiselectable="true"
        tabIndex={0}
        aria-activedescendant={`t-${active}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((i) => Math.min(tags.length - 1, i + 1));
        }}
        // Selects on keyup, so the hook has to see Space belongs to the list.
        onKeyUp={(e) => {
          if (e.key === " ")
            setPicked((p) => (p.includes(active) ? p.filter((i) => i !== active) : [...p, active]));
        }}
        style={{ border: "1px solid var(--i258-border-strong)", borderRadius: 8, padding: 4 }}
      >
        {tags.map((t, i) => (
          <div key={t} id={`t-${i}`} role="option" aria-selected={picked.includes(i)} style={{ padding: 4 }}>
            {t}
          </div>
        ))}
      </div>
      {output}
    </div>
  );
}

/**
 * A focused listbox that names its active option with
 * aria-activedescendant keeps Space: it selects, and the page's Space
 * doesn't run (or cancel the key).
 */
export const ListboxKeepsSpace: Story = {
  name: "A focused listbox keeps Space",
  render: () => <TagList />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const list = c.getByRole("listbox", { name: "Tags" });
    list.focus();
    await press("{ArrowDown}");
    let spaceKept: boolean | undefined;
    const spy = (e: KeyboardEvent) => {
      if (e.key === " ") spaceKept = !e.defaultPrevented;
    };
    document.addEventListener("keydown", spy);
    try {
      await press(" ");
    } finally {
      document.removeEventListener("keydown", spy);
    }
    await expect(c.getByRole("option", { name: "Ledger" })).toHaveAttribute("aria-selected", "true");
    await expect(c.getByTestId("last")).toHaveTextContent("Nothing yet");
    await expect(spaceKept).toBe(true);
    // Off the list, the page's Space runs.
    blur();
    await press(" ");
    await expect(c.getByTestId("last")).toHaveTextContent("Play/pause");
  },
};

/**
 * A list on the page that happens to be a listbox is not a popup: with
 * focus in it, `u` still works, while ↓ stays the list's own.
 */
export const StaticList: Story = {
  name: "A listbox on the page is not a popup",
  render: () => (
    <ShortcutsProvider singleKeyShortcuts>
      <QueueList />
    </ShortcutsProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const list = c.getByRole("listbox", { name: "Queue" });
    list.focus();
    await press("{ArrowDown}");
    await expect(list).toHaveAttribute("aria-activedescendant", "q-1");
    await expect(c.getByTestId("last")).toHaveTextContent("Nothing yet");
    await press("u");
    await expect(c.getByTestId("last")).toHaveTextContent("Undo");
    // Off the list, the page's ↓ runs.
    blur();
    await press("{ArrowDown}");
    await expect(c.getByTestId("last")).toHaveTextContent("Next view");
  },
};

/** A focused treegrid keeps its arrow keys too. */
export const TreegridKeepsArrows: Story = {
  name: "A focused treegrid keeps its arrow keys",
  render: () => <QueueList role="treegrid" />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const grid = c.getByRole("treegrid", { name: "Queue" });
    grid.focus();
    let arrowKept: boolean | undefined;
    const spy = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") arrowKept = !e.defaultPrevented;
    };
    document.addEventListener("keydown", spy);
    try {
      await press("{ArrowDown}");
    } finally {
      document.removeEventListener("keydown", spy);
    }
    await expect(grid).toHaveAttribute("aria-activedescendant", "q-1");
    await expect(c.getByTestId("last")).toHaveTextContent("Nothing yet");
    await expect(arrowKept).toBe(true);
    blur();
    await press("{ArrowDown}");
    await expect(c.getByTestId("last")).toHaveTextContent("Next view");
  },
};

/**
 * Chrome's autofill dispatches keydown events with no `key`. The hook
 * ignores them instead of throwing.
 */
export const KeylessKeydown: Story = {
  name: "A keydown with no key is ignored",
  render: () => <QueueList />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const errors: unknown[] = [];
    const onError = (e: ErrorEvent) => errors.push(e.error);
    window.addEventListener("error", onError);
    try {
      document.dispatchEvent(new Event("keydown", { bubbles: true, cancelable: true }));
    } finally {
      window.removeEventListener("error", onError);
    }
    await expect(errors).toEqual([]);
    await expect(c.getByTestId("last")).toHaveTextContent("Nothing yet");
    // The hook still answers real keys afterwards.
    await press("{ArrowDown}");
    await expect(c.getByTestId("last")).toHaveTextContent("Next view");
  },
};
