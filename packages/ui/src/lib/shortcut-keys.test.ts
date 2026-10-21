import { describe, expect, it } from "vitest";

import {
  ariaKeyShortcuts,
  bindingFromEvent,
  formatShortcut,
  isCharacterBinding,
  normaliseBinding,
  type KeyLike,
} from "./shortcut-keys.js";

const ev = (key: string, mods: Partial<Omit<KeyLike, "key">> = {}): KeyLike => ({
  key,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  ...mods,
});

describe("normaliseBinding", () => {
  it("resolves mod per platform and orders modifiers", () => {
    expect(normaliseBinding("Mod+K", true)).toBe("meta+k");
    expect(normaliseBinding("mod+k", false)).toBe("ctrl+k");
    expect(normaliseBinding("shift+alt+x", false)).toBe("alt+shift+x");
    expect(normaliseBinding("Control+Option+Cmd+p", false)).toBe("ctrl+alt+meta+p");
  });

  it("keeps named keys and spells Space and Escape one way", () => {
    expect(normaliseBinding("Enter")).toBe("Enter");
    expect(normaliseBinding("space")).toBe("Space");
    expect(normaliseBinding("esc")).toBe("Escape");
  });

  it("spells a shifted digit symbol in a command chord as shift+digit", () => {
    expect(normaliseBinding("ctrl+!", false)).toBe("ctrl+shift+1");
    expect(normaliseBinding("mod+shift+)", true)).toBe("meta+shift+0");
    expect(normaliseBinding("alt+@", false)).toBe(normaliseBinding("alt+shift+2", false));
    // No command modifier: the typed character.
    expect(normaliseBinding("!")).toBe("!");
    expect(normaliseBinding("shift+!")).toBe("shift+!");
  });

  it("reads a trailing + as the plus key", () => {
    expect(normaliseBinding("+")).toBe("+");
    expect(normaliseBinding("mod++", true)).toBe("meta++");
  });
});

describe("bindingFromEvent", () => {
  it("spells the event the way normaliseBinding spells the binding", () => {
    expect(bindingFromEvent(ev("k", { metaKey: true }))).toBe(normaliseBinding("mod+k", true));
    expect(bindingFromEvent(ev("k", { ctrlKey: true }))).toBe(normaliseBinding("mod+k", false));
    expect(bindingFromEvent(ev("K", { metaKey: true, shiftKey: true }))).toBe("meta+shift+k");
    expect(bindingFromEvent(ev("1"))).toBe("1");
    expect(bindingFromEvent(ev(" "))).toBe("Space");
    expect(bindingFromEvent(ev("Enter"))).toBe("Enter");
  });

  it("treats Caps Lock as the plain letter, and Shift on a letter as a modifier", () => {
    expect(bindingFromEvent(ev("U"))).toBe("u");
    expect(bindingFromEvent(ev("U", { shiftKey: true }))).toBe("shift+u");
  });

  it("does not add shift to symbols that already encode it", () => {
    expect(bindingFromEvent(ev("?", { shiftKey: true }))).toBe("?");
  });

  it("binds the key cap under ⌥, not the character it types on a Mac", () => {
    expect(bindingFromEvent(ev("¡", { altKey: true, code: "Digit1" }), true)).toBe("alt+1");
    expect(bindingFromEvent(ev("π", { altKey: true, code: "KeyP" }), true)).toBe("alt+p");
  });

  it("binds the physical key when the layout types a non-Latin character", () => {
    expect(bindingFromEvent(ev("л", { ctrlKey: true, code: "KeyK" }), false)).toBe("ctrl+k");
    expect(bindingFromEvent(ev("л", { metaKey: true, code: "KeyK" }), true)).toBe("meta+k");
  });

  it("keeps Shift on a digit in a command chord, so shifted and plain digits differ", () => {
    // US: Ctrl+1 types "1", Ctrl+Shift+1 types "!".
    expect(bindingFromEvent(ev("1", { ctrlKey: true, code: "Digit1" }), false)).toBe("ctrl+1");
    expect(bindingFromEvent(ev("!", { ctrlKey: true, shiftKey: true, code: "Digit1" }), false)).toBe(
      "ctrl+shift+1",
    );
    // Mac: ⌥1 types "¡", ⌥⇧1 types "⁄"; ⌘⇧1 may report "!" or "1".
    expect(bindingFromEvent(ev("⁄", { altKey: true, shiftKey: true, code: "Digit1" }), true)).toBe(
      "alt+shift+1",
    );
    expect(bindingFromEvent(ev("!", { metaKey: true, shiftKey: true, code: "Digit1" }), true)).toBe(
      "meta+shift+1",
    );
    expect(bindingFromEvent(ev("1", { metaKey: true, shiftKey: true, code: "Digit1" }), true)).toBe(
      "meta+shift+1",
    );
    // AZERTY: the 1 key types "&", and "1" with Shift. Same chords as US.
    expect(bindingFromEvent(ev("&", { ctrlKey: true, code: "Digit1" }), false)).toBe("ctrl+1");
    expect(bindingFromEvent(ev("1", { ctrlKey: true, shiftKey: true, code: "Digit1" }), false)).toBe(
      "ctrl+shift+1",
    );
  });

  it("matches ctrl+! and ctrl+shift+1 to the same US keypress", () => {
    const step = bindingFromEvent(ev("!", { ctrlKey: true, shiftKey: true, code: "Digit1" }), false);
    expect(step).toBe(normaliseBinding("ctrl+!", false));
    expect(step).toBe(normaliseBinding("ctrl+shift+1", false));
    const mac = bindingFromEvent(ev("!", { metaKey: true, shiftKey: true, code: "Digit1" }), true);
    expect(mac).toBe(normaliseBinding("mod+!", true));
  });

  it("keeps Shift on the space bar", () => {
    expect(bindingFromEvent(ev(" ", { shiftKey: true }))).toBe(normaliseBinding("shift+Space"));
    expect(bindingFromEvent(ev(" ", { shiftKey: true }))).not.toBe(normaliseBinding("Space"));
    expect(bindingFromEvent(ev(" ", { ctrlKey: true, shiftKey: true }), false)).toBe(
      normaliseBinding("ctrl+shift+Space", false),
    );
  });

  it("leaves Shift off a digit typed without a command modifier", () => {
    // AZERTY types "1" with Shift: that is the character binding `1`.
    expect(bindingFromEvent(ev("1", { shiftKey: true, code: "Digit1" }), false)).toBe("1");
    expect(bindingFromEvent(ev("!", { shiftKey: true, code: "Digit1" }), false)).toBe("!");
  });

  it("keeps the letter the layout typed, and leaves AltGr alone", () => {
    // QWERTZ: the key labelled Z sits where US QWERTY has Y.
    expect(bindingFromEvent(ev("z", { altKey: true, code: "KeyY" }), false)).toBe("alt+z");
    expect(bindingFromEvent(ev("z", { ctrlKey: true, code: "KeyY" }), false)).toBe("ctrl+z");
    // Windows AltGr (Ctrl+Alt) + Q types "@" on a German layout.
    expect(bindingFromEvent(ev("@", { ctrlKey: true, altKey: true, code: "KeyQ" }), false)).toBe(
      "ctrl+alt+@",
    );
    // No modifier: never remapped.
    expect(bindingFromEvent(ev("л", { code: "KeyK" }), false)).toBe("л");
  });
});

describe("isCharacterBinding (WCAG 2.1.4)", () => {
  it("covers letters, digits and symbols with no command modifier", () => {
    for (const b of ["1", "u", "?", "/", "+", "shift+u"]) {
      expect(isCharacterBinding(normaliseBinding(b))).toBe(true);
    }
  });

  it("excludes named keys and command chords", () => {
    for (const b of ["Enter", "Escape", "Space", "ArrowDown", "meta+k", "ctrl+k", "alt+1", "ctrl++"]) {
      expect(isCharacterBinding(normaliseBinding(b))).toBe(false);
    }
  });
});

describe("ariaKeyShortcuts", () => {
  it("spells ARIA key names", () => {
    expect(ariaKeyShortcuts("mod+k", true)).toBe("Meta+K");
    expect(ariaKeyShortcuts("mod+k", false)).toBe("Control+K");
    expect(ariaKeyShortcuts("shift+alt+p", false)).toBe("Alt+Shift+P");
    expect(ariaKeyShortcuts("1")).toBe("1");
    expect(ariaKeyShortcuts("Enter")).toBe("Enter");
  });
});

describe("formatShortcut", () => {
  it("draws Apple glyphs in Apple order", () => {
    expect(formatShortcut("mod+k", true)).toBe("⌘K");
    expect(formatShortcut("mod+shift+p", true)).toBe("⇧⌘P");
    expect(formatShortcut("alt+1", true)).toBe("⌥1");
  });

  it("spells modifiers out elsewhere", () => {
    expect(formatShortcut("mod+k", false)).toBe("Ctrl+K");
    expect(formatShortcut("mod+shift+p", false)).toBe("Ctrl+Shift+P");
    expect(formatShortcut("Enter", false)).toBe("↵");
    expect(formatShortcut("u", false)).toBe("U");
  });
});
