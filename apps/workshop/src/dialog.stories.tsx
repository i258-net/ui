import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  AppFrame,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  FormField,
  FrameHeader,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@i258/ui";

import { withDocumentTheme } from "./document-theme";

/**
 * A modal dialog on Base UI: focus moves in and is trapped, the page
 * behind is inert, Escape or the backdrop closes it, and focus returns to
 * the trigger. The corner Close is on by default so touch screen-reader
 * users always have a way out.
 */
const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
  decorators: [withDocumentTheme],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

function ConfirmDialog(props: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogTrigger render={<Button variant="secondary" />}>Resolve decision</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Resolve X-19?</DialogTitle>
        <DialogDescription>
          Marked urgent, so it needs a confirm. You can reopen it from the session list.
        </DialogDescription>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Resolve</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Open from the trigger, Tab cycles inside, Escape closes and focus goes
 * back to the trigger.
 */
export const Confirm: Story = {
  render: () => <ConfirmDialog />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Resolve decision" });
    await userEvent.click(trigger);
    const dialog = await body().findByRole("dialog", { name: "Resolve X-19?" });
    await expect(dialog).toHaveAccessibleDescription(/needs a confirm/);
    await waitFor(() => expect(body().getByRole("button", { name: "Cancel" })).toHaveFocus());

    // Focus is trapped: Cancel → Resolve → Close → back to Cancel.
    await userEvent.tab();
    await expect(body().getByRole("button", { name: "Resolve" })).toHaveFocus();
    await userEvent.tab();
    await expect(body().getByRole("button", { name: "Close" })).toHaveFocus();
    await userEvent.tab();
    await expect(body().getByRole("button", { name: "Cancel" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/** Open, for the a11y check and VRT: title, description, footer, Close. */
export const Open: Story = {
  render: () => <ConfirmDialog defaultOpen />,
  play: async () => {
    await body().findByRole("dialog", { name: "Resolve X-19?" });
  },
};

/** A form: focus starts in the first field; the footer's submit closes. */
export const WithForm: Story = {
  name: "With a form",
  render: function WithForm() {
    const [open, setOpen] = React.useState(false);
    const [name, setName] = React.useState("Inbox");
    return (
      <>
        <p style={{ margin: "0 0 12px" }}>
          View name: <output data-testid="name">{name}</output>
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="secondary" />}>Rename view</DialogTrigger>
          <DialogContent>
            <DialogTitle>Rename view</DialogTitle>
            <form
              id="rename"
              onSubmit={(e) => {
                e.preventDefault();
                setName(new FormData(e.currentTarget).get("name") as string);
                setOpen(false);
              }}
            >
              <DialogBody>
                <FormField label="Name">
                  <Input name="name" defaultValue={name} />
                </FormField>
              </DialogBody>
            </form>
            <DialogFooter>
              <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
              <Button type="submit" form="rename">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Rename view" }));
    const field = await body().findByRole("textbox", { name: "Name" });
    await waitFor(() => expect(field).toHaveFocus());
    await userEvent.clear(field);
    await userEvent.type(field, "Waiting on you{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(c.getByTestId("name")).toHaveTextContent("Waiting on you");
    await expect(c.getByRole("button", { name: "Rename view" })).toHaveFocus();
  },
};

/** The page behind an open dialog is out of reach of Tab and the pointer. */
export const PageIsInert: Story = {
  name: "Page behind is inert",
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Button variant="secondary">Behind</Button>
      <ConfirmDialog />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Resolve decision" }));
    await body().findByRole("dialog");
    // Out of the accessibility tree while the dialog is open.
    await expect(c.queryByRole("button", { name: "Behind" })).toBeNull();
    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      await expect(body().getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
    }
    await userEvent.click(body().getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(c.getByRole("button", { name: "Behind" })).toBeInTheDocument();
  },
};

/**
 * Inside an AppFrame, dialogs and menus portal into the frame's layer, so
 * they take the frame's theme and density rather than the document's.
 * Here the document is light and the frame is dark and compact.
 */
export const InsideAppFrame: Story = {
  name: "Inside an AppFrame",
  parameters: { layout: "fullscreen" },
  globals: { theme: "light" },
  render: () => (
    <div data-theme="dark" style={{ height: 420 }}>
      <AppFrame
        density="compact"
        header={
          <FrameHeader
            title="Inbox"
            actions={
              <Menu>
                <MenuTrigger render={<Button variant="secondary" size="sm" />}>View</MenuTrigger>
                <MenuContent align="end">
                  <MenuItem>Compact rows</MenuItem>
                </MenuContent>
              </Menu>
            }
          />
        }
      >
        <div style={{ padding: 20 }}>
          <ConfirmDialog />
        </div>
      </AppFrame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const layer = canvasElement.querySelector(".i258-frame__layer")!;
    const darkBackground = getComputedStyle(canvasElement.querySelector("[data-theme=dark]")!)
      .getPropertyValue("--i258-background")
      .trim();
    await expect(document.documentElement).toHaveAttribute("data-theme", "light");

    await userEvent.click(c.getByRole("button", { name: "View" }));
    const menu = await body().findByRole("menu");
    await expect(layer).toContainElement(menu);
    const item = within(menu).getByRole("menuitem", { name: "Compact rows" });
    // Compact control-sm is 24px; comfortable would be 28px. (offsetHeight:
    // the menu is still scaling in.)
    await expect(item.offsetHeight).toBe(24);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());

    await userEvent.click(c.getByRole("button", { name: "Resolve decision" }));
    const dialog = await body().findByRole("dialog", { name: "Resolve X-19?" });
    await expect(layer).toContainElement(dialog);
    await expect(getComputedStyle(dialog).getPropertyValue("--i258-background").trim()).toBe(
      darkBackground,
    );
    await expect(dialog.closest("[data-density]")).toHaveAttribute("data-density", "compact");
  },
};
