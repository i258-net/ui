import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Tooltip,
  TooltipProvider,
  useShortcut,
} from "@i258/ui";

import { withDocumentTheme } from "./document-theme";

/**
 * A visual label for an icon-only control or a glyph, on Base UI's
 * Tooltip. WCAG 1.4.13: hoverable (move onto it and it stays), persistent
 * (no timeout) and dismissible (Escape closes the tip, and only the tip:
 * an enclosing dialog or inspector waits for the next press). The tip is
 * `aria-hidden`; the trigger carries its own name.
 */
const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  decorators: [withDocumentTheme],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);
const tip = () => document.querySelector<HTMLElement>("[data-slot='tooltip']");

const ArchiveIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="2" y="3" width="12" height="3" rx="1" />
    <path d="M3 6v6.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6M6.5 9h3" strokeLinecap="round" />
  </svg>
);

const StaleIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3l2 1.5" strokeLinecap="round" />
  </svg>
);

function Pair() {
  return (
    <TooltipProvider delay={0}>
      <div style={{ display: "flex", gap: 24, alignItems: "center", padding: 48 }}>
        <Tooltip content="Archive">
          <Button variant="ghost" size="sm" shape="icon" aria-label="Archive">
            <ArchiveIcon />
          </Button>
        </Tooltip>
        {/* A glyph: not focusable, so its words are in the DOM too. */}
        <Tooltip content="Stale (≥ 14 d)">
          <span data-testid="glyph" style={{ display: "inline-flex", color: "var(--i258-muted)" }}>
            <StaleIcon />
            <span className="i258-sr-only">Stale</span>
          </span>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/** An icon button and a glyph. Hover, keyboard focus, hoverable, persistent, Escape. */
export const Default: Story = {
  args: { content: "Archive", children: <span /> },
  render: () => <Pair />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const button = c.getByRole("button", { name: "Archive" });

    // Hover opens it; the trigger keeps its own name and the tip is hidden
    // from assistive tech.
    await userEvent.hover(button);
    await waitFor(() => expect(tip()).toBeVisible());
    await expect(tip()).toHaveTextContent("Archive");
    await expect(tip()).toHaveAttribute("aria-hidden", "true");
    await expect(button).toHaveAccessibleName("Archive");

    // Hoverable: the pointer can move onto the tip.
    await userEvent.hover(tip()!);
    await new Promise((r) => setTimeout(r, 300));
    await expect(tip()).toBeVisible();

    // Persistent: still there after a while.
    await new Promise((r) => setTimeout(r, 1200));
    await expect(tip()).toBeVisible();

    // Dismissible: Escape closes it with the pointer still on it.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip()).toBeNull());
    await userEvent.unhover(button);

    // Keyboard focus opens it too; Escape closes it and focus stays put.
    await userEvent.click(document.body);
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(tip()).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip()).toBeNull());
    await expect(button).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(tip()).toBeNull());

    // A glyph: hover-only, its word stays in the accessibility tree.
    const glyph = c.getByTestId("glyph");
    await expect(glyph).toHaveTextContent("Stale");
    await expect(glyph).not.toHaveAttribute("tabindex");
    await userEvent.hover(glyph);
    await waitFor(() => expect(tip()).toHaveTextContent("Stale (≥ 14 d)"));
    await userEvent.unhover(glyph);
    await waitFor(() => expect(tip()).toBeNull());
  },
};

/** Open, for the a11y check and VRT. */
export const Open: Story = {
  args: { content: "Archive", children: <span /> },
  render: () => (
    <div style={{ padding: 48 }}>
      <TooltipProvider delay={0}>
        <Tooltip content="Archive (⌫)">
          <Button variant="secondary" size="sm" shape="icon" aria-label="Archive" data-testid="trigger">
            <ArchiveIcon />
          </Button>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByTestId("trigger"));
    await waitFor(() => expect(tip()).toBeVisible());
  },
};

function DialogDemo() {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Reopen
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogTitle>Issue X-19</DialogTitle>
          <DialogDescription>Hover or focus the archive button for its tip.</DialogDescription>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="sm">
              Assign
            </Button>
            <TooltipProvider delay={0}>
              <Tooltip content="Archive">
                <Button variant="ghost" size="sm" shape="icon" aria-label="Archive">
                  <ArchiveIcon />
                </Button>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Escape with a tip open inside a dialog closes the tip only; the next
 * Escape closes the dialog. Both ways a tip opens: keyboard focus on its
 * trigger, and hover while focus is elsewhere in the dialog.
 */
export const EscapeInsideDialog: Story = {
  args: { content: "Archive", children: <span /> },
  render: () => <DialogDemo />,
  play: async () => {
    const dialog = await body().findByRole("dialog");
    const archive = within(dialog).getByRole("button", { name: "Archive" });
    const assign = within(dialog).getByRole("button", { name: "Assign" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    // Hover, with focus on another control in the dialog.
    assign.focus();
    await userEvent.hover(archive);
    await waitFor(() => expect(tip()).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip()).toBeNull());
    await expect(body().getByRole("dialog")).toBeInTheDocument();
    await expect(assign).toHaveFocus();
    await userEvent.unhover(archive);

    // Keyboard focus on the trigger.
    await userEvent.tab();
    await expect(archive).toHaveFocus();
    await waitFor(() => expect(tip()).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip()).toBeNull());
    await expect(body().getByRole("dialog")).toBeInTheDocument();
    await expect(archive).toHaveFocus();

    // Nothing open now: Escape is the dialog's again.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/**
 * The inline-inspector case: the app closes its inspector on Escape with
 * useShortcut. A tip opened by hovering a glyph while focus sits on a row
 * control: the first Escape closes the tip only and focus stays; the
 * second closes the inspector. The same with keyboard focus on a trigger.
 */
export const EscapeInsideInspector: Story = {
  args: { content: "Archive", children: <span /> },
  render: function EscapeInsideInspector() {
    const [open, setOpen] = React.useState(true);
    useShortcut("Escape", () => setOpen(false), { enabled: open });
    return (
      <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open inspector
        </Button>
        {open ? (
          <aside
            aria-label="Inspector"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: 16,
              border: "1px solid var(--i258-border)",
              borderRadius: 10,
            }}
          >
            <Button variant="secondary" size="sm">
              Assign
            </Button>
            <TooltipProvider delay={0}>
              <Tooltip content="Stale (≥ 14 d)">
                <span data-testid="glyph" style={{ display: "inline-flex" }}>
                  <StaleIcon />
                  <span className="i258-sr-only">Stale</span>
                </span>
              </Tooltip>
              <Tooltip content="Archive">
                <Button variant="ghost" size="sm" shape="icon" aria-label="Archive">
                  <ArchiveIcon />
                </Button>
              </Tooltip>
            </TooltipProvider>
          </aside>
        ) : null}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const inspector = () => c.queryByRole("complementary", { name: "Inspector" });
    const assign = c.getByRole("button", { name: "Assign" });
    const glyph = c.getByTestId("glyph");

    await userEvent.click(assign);
    await userEvent.hover(glyph);
    await waitFor(() => expect(tip()).toHaveTextContent("Stale (≥ 14 d)"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip()).toBeNull());
    await expect(inspector()).toBeInTheDocument();
    await expect(assign).toHaveFocus();
    await userEvent.unhover(glyph);

    const archive = c.getByRole("button", { name: "Archive" });
    await userEvent.tab();
    await expect(archive).toHaveFocus();
    await waitFor(() => expect(tip()).toHaveTextContent("Archive"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip()).toBeNull());
    await expect(inspector()).toBeInTheDocument();
    await expect(archive).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(inspector()).toBeNull());
  },
};

/** A disabled tooltip never opens; the trigger still works. */
export const Disabled: Story = {
  args: { content: "Archive", children: <span /> },
  render: () => (
    <TooltipProvider delay={0}>
      <Tooltip content="Archive" disabled>
        <Button variant="secondary" size="sm">
          Archive
        </Button>
      </Tooltip>
    </TooltipProvider>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Archive" });
    await userEvent.hover(button);
    await new Promise((r) => setTimeout(r, 200));
    await expect(tip()).toBeNull();
  },
};

const never = new Promise<never>(() => {});
function SuspendsWhen({ on }: { on: boolean }) {
  if (on) React.use(never);
  return null;
}

/** What a controlled tip reported through onOpenChange, for the play function. */
const controlledReports: boolean[] = [];

function ControlledDemo() {
  const [open, setOpen] = React.useState(true);
  const [suspend, setSuspend] = React.useState(false);
  const [, startTransition] = React.useTransition();
  return (
    <TooltipProvider delay={0}>
      <div style={{ display: "flex", gap: 24, alignItems: "center", padding: 48 }}>
        <Tooltip
          content="Archive"
          open={open}
          onOpenChange={(next) => {
            controlledReports.push(next);
            setOpen(next);
          }}
        >
          <Button variant="ghost" size="sm" shape="icon" aria-label="Archive">
            <ArchiveIcon />
          </Button>
        </Tooltip>
        {/* Renders the tip closed in a transition that never commits. */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            startTransition(() => {
              setOpen(false);
              setSuspend(true);
            })
          }
        >
          Close in a suspended transition
        </Button>
        <React.Suspense fallback={null}>
          <SuspendsWhen on={suspend} />
        </React.Suspense>
      </div>
    </TooltipProvider>
  );
}

/**
 * Controlled `open`. A render React discards (here a transition that
 * suspends) does not count as reported: the next Escape still closes the
 * committed tip, and reports the close once.
 */
export const Controlled: Story = {
  args: { content: "Archive", children: <span /> },
  render: () => <ControlledDemo />,
  play: async ({ canvasElement }) => {
    controlledReports.length = 0;
    const c = within(canvasElement);
    await waitFor(() => expect(tip()).toBeVisible());

    // A click event alone: no pointerdown, so no outside press.
    c.getByRole("button", { name: "Close in a suspended transition" }).click();
    await new Promise((r) => setTimeout(r, 200));
    await expect(tip()).toBeVisible();
    await expect(controlledReports).toEqual([]);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip()).toBeNull());
    await expect(controlledReports).toEqual([false]);
  },
};

/** The pair with no play function, for the real-pointer checks in vrt/tooltip.spec.ts. */
export const Static: Story = {
  args: { content: "Archive", children: <span /> },
  render: () => <Pair />,
};

/** The dialog with no play function, for vrt/tooltip.spec.ts. */
export const InDialog: Story = {
  args: { content: "Archive", children: <span /> },
  render: () => <DialogDemo />,
};
