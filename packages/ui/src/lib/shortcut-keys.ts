/**
 * Pure key-matching rules behind `useShortcut` (lib/use-shortcut.tsx). No
 * React and no DOM, so the rules are unit-tested on their own.
 *
 * Binding syntax: `[mod+][ctrl+][alt+][shift+]key`, e.g. `1`, `u`, `?`,
 * `Enter`, `mod+k`, `alt+shift+p`. `mod` is ⌘ on Apple platforms and Ctrl
 * elsewhere. `key` is a `KeyboardEvent.key` value (`Escape`, `ArrowDown`),
 * any case for a single character; `Space` is the space bar. Single steps
 * only: no `g i`-style sequences, and no "press it twice" bindings.
 *
 * In a command chord (Ctrl / Alt / ⌘) a digit key binds by position, so a
 * US-shifted digit symbol is spelled `shift+<digit>`: `mod+!` is
 * `mod+shift+1`. Without a command modifier `!` stays the typed character.
 */

/** Whether `mod` means ⌘. `false` on the server. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ||
    navigator.platform ||
    navigator.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform);
}

const MODIFIERS = ["ctrl", "alt", "meta", "shift"] as const;

// The US key caps' shifted digits, for chords spelled with the symbol.
const SHIFTED_DIGITS: Record<string, string> = {
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
};

function normaliseKey(key: string): string {
  if (key === " " || key.toLowerCase() === "space") return "Space";
  if (key.toLowerCase() === "esc") return "Escape";
  return key.length === 1 ? key.toLowerCase() : key;
}

/** One canonical spelling, so `Mod+K` and `mod+k` compare equal. */
export function normaliseBinding(binding: string, apple = isApplePlatform()): string {
  const trimmed = binding.trim();
  // A trailing `+` is the plus key itself (`mod++`, or just `+`).
  const plusKey = trimmed.endsWith("+");
  const parts = (plusKey ? trimmed.slice(0, -1) : trimmed).split("+").filter(Boolean);
  let key = plusKey ? "+" : (parts.pop() ?? "");
  const mods = new Set(parts.map((p) => p.toLowerCase()));
  if (mods.delete("mod")) mods.add(apple ? "meta" : "ctrl");
  if (mods.delete("control")) mods.add("ctrl");
  if (mods.delete("option")) mods.add("alt");
  if (mods.delete("cmd")) mods.add("meta");
  // bindingFromEvent reads Ctrl+Shift+1 as ctrl+shift+1 on every layout, so
  // `ctrl+!` has to mean that too or it never fires.
  const digit = SHIFTED_DIGITS[key];
  if (digit && (mods.has("ctrl") || mods.has("alt") || mods.has("meta"))) {
    key = digit;
    mods.add("shift");
  }
  return [...MODIFIERS.filter((m) => mods.has(m)), normaliseKey(key)].join("+");
}

export type KeyLike = {
  key: string;
  code?: string | undefined;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  getModifierState?: (key: string) => boolean;
};

/** The binding a keydown spells, in `normaliseBinding` form. */
export function bindingFromEvent(event: KeyLike, apple = isApplePlatform()): string {
  let key = event.key;
  // With a modifier held the key can type something that isn't on the
  // binding: ⌥1 on a Mac is "¡", Ctrl+K on a Cyrillic layout is "л". Then,
  // and only then, bind the physical key (`code`, US positions). A plain
  // letter or digit is what the user pressed on their own layout (QWERTZ's Z
  // is code KeyY). AltGr is the AltGraph modifier, not every Ctrl+Alt chord.
  const altGr =
    event.ctrlKey &&
    event.altKey &&
    !event.metaKey &&
    !apple &&
    event.getModifierState?.("AltGraph") === true;
  const command = (event.ctrlKey || event.altKey || event.metaKey) && !altGr;
  if (command && event.code && !/^[a-z0-9]$/i.test(key)) {
    const cap = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(event.code);
    if (cap) key = cap[1] ?? cap[2] ?? key;
  }
  if (altGr) {
    const out: string[] = [];
    if (event.shiftKey && (key.length > 1 || key === " " || /^[a-z]$/i.test(key)))
      out.push("shift");
    out.push(normaliseKey(key));
    return out.join("+");
  }
  const out: string[] = [];
  if (event.ctrlKey) out.push("ctrl");
  if (event.altKey) out.push("alt");
  if (event.metaKey) out.push("meta");
  // A typed symbol already spells Shift (`?` is shift+/); letters and named
  // keys carry it as a modifier. So does a digit in a command chord, however
  // the layout reports it: Ctrl+Shift+1 types "!" on US (bound by its key
  // cap above) and "1" on AZERTY, and both are ctrl+shift+1, never ctrl+1.
  // The space bar is a named key, though its `key` is one character.
  if (
    event.shiftKey &&
    (key.length > 1 || key === " " || /^[a-z]$/i.test(key) || (command && /^[0-9]$/.test(key)))
  )
    out.push("shift");
  out.push(normaliseKey(key));
  return out.join("+");
}

/**
 * A character-key shortcut (WCAG 2.1.4): a letter, digit, symbol or
 * punctuation key with no Ctrl / Alt / ⌘. These are off until the app opts
 * in. Named keys (`Enter`, `Escape`, arrows) and modifier chords are not.
 */
export function isCharacterBinding(normalised: string): boolean {
  const parts = normalised.split("+");
  const key = normalised.endsWith("++") || normalised === "+" ? "+" : (parts.at(-1) ?? "");
  const command = parts.some((p) => p === "ctrl" || p === "alt" || p === "meta");
  return !command && key.length === 1;
}

const ARIA_NAMES: Record<string, string> = {
  ctrl: "Control",
  alt: "Alt",
  meta: "Meta",
  shift: "Shift",
};

/**
 * The binding as an `aria-keyshortcuts` value: `mod+k` → `Meta+K` on Apple
 * platforms, `Control+K` elsewhere.
 */
export function ariaKeyShortcuts(binding: string, apple = isApplePlatform()): string {
  const parts = normaliseBinding(binding, apple).split(/\+(?!$)/);
  return parts
    .map((p) => ARIA_NAMES[p] ?? (p.length === 1 ? p.toUpperCase() : p))
    .join("+");
}

const APPLE_GLYPHS: Record<string, string> = {
  ctrl: "⌃",
  alt: "⌥",
  shift: "⇧",
  meta: "⌘",
};

const KEY_GLYPHS: Record<string, string> = {
  Enter: "↵",
  Escape: "Esc",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Backspace: "⌫",
  Delete: "Del",
  Space: "Space",
};

/**
 * The binding as people read it on a key cap: `⌘K` on Apple platforms,
 * `Ctrl+K` elsewhere. The platform comes from `navigator`, so on the server
 * pass `apple` explicitly or render it after hydration.
 */
export function formatShortcut(binding: string, apple = isApplePlatform()): string {
  const parts = normaliseBinding(binding, apple).split(/\+(?!$)/);
  const key = parts.pop() ?? "";
  const cap = KEY_GLYPHS[key] ?? (key.length === 1 ? key.toUpperCase() : key);
  if (apple) {
    // Apple order: ⌃ ⌥ ⇧ ⌘, no separators.
    const order = ["ctrl", "alt", "shift", "meta"];
    return [...order.filter((m) => parts.includes(m)).map((m) => APPLE_GLYPHS[m]), cap].join("");
  }
  const names: Record<string, string> = { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Win" };
  return [...parts.map((m) => names[m] ?? m), cap].join("+");
}
