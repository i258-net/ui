import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShortcutsProvider, useShortcut, useSingleKeyShortcuts } from "../lib/use-shortcut.js";
import { CommandPalette } from "./command-palette.js";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog.js";
import { Kbd } from "./kbd.js";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu.js";

/*
  Server render with no `window` / `document`: shortcuts register nothing,
  and closed popups are not in the markup, so the first client render
  agrees with it.
*/
describe("overlays on the server", () => {
  it("renders closed dialogs, menus and the palette as their triggers only", () => {
    expect(typeof document).toBe("undefined");
    const html = renderToString(
      <>
        <Dialog>
          <DialogTrigger>Edit</DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit record</DialogTitle>
          </DialogContent>
        </Dialog>
        <Menu>
          <MenuTrigger>Actions</MenuTrigger>
          <MenuContent>
            <MenuItem>Archive</MenuItem>
          </MenuContent>
        </Menu>
        <CommandPalette open={false} onOpenChange={() => {}} items={[]} />
      </>,
    );
    expect(html).toContain(">Edit</button>");
    expect(html).toContain(">Actions</button>");
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('role="menu"');
    expect(html).not.toContain("Archive");
  });

  it("registers shortcuts without touching the DOM, single keys off by default", () => {
    const seen: boolean[] = [];
    function Probe() {
      useShortcut(["mod+k", "1"], () => {});
      seen.push(useSingleKeyShortcuts());
      return <Kbd>⌘K</Kbd>;
    }
    const html = renderToString(
      <>
        <Probe />
        <ShortcutsProvider singleKeyShortcuts>
          <Probe />
        </ShortcutsProvider>
      </>,
    );
    expect(html).toContain('<kbd data-slot="kbd" class="i258-kbd">⌘K</kbd>');
    expect(seen).toEqual([false, true]);
  });
});
