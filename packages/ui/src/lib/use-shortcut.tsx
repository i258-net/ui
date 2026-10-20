import * as React from "react";

import { bindingFromEvent, isCharacterBinding, normaliseBinding } from "./shortcut-keys.js";

/*
  Keyboard shortcuts with the rules every i258 app shares (I25-119), so
  muscle memory and the off switch carry across apps:

  - Character keys (`1`, `u`, `?`) are opt-in. They fire only inside a
    `ShortcutsProvider singleKeyShortcuts` — the app's Settings on/off
    control — so nothing intercepts a key a screen reader or the user
    expected to reach the page (WCAG 2.1.4). Modifier chords (⌘K) and named
    keys (Enter, Escape) work without opting in.
  - Typing is never hijacked. Nothing fires from a text field, select,
    combobox or contenteditable unless the binding passes `allowInInput`,
    and a character key never does.
  - Open popups own the keyboard. Nothing fires while a dialog, menu or
    listbox popup is open, or with focus inside one, unless the binding
    passes `allowInLayer`.
  - A focused control keeps its own keys: Enter and Space on a button,
    link or other widget activate it rather than a shortcut, and arrow
    keys stay with composite widgets (menus, tabs, radio groups, sliders).
  - Auto-repeat never fires, and there are no "press it twice" bindings:
    pressing the same key again runs the same handler again. Confirm with
    Enter; a repeated digit is never a confirmation.

  Latest registration wins, so a view can override a frame-level binding.
*/

export type ShortcutOptions = {
  /** Register only while true. Default true. */
  enabled?: boolean | undefined;
  /**
   * Fire even when focus is in a text field (⌘K does). Ignored for
   * character keys, which would eat what the user types.
   */
  allowInInput?: boolean | undefined;
  /** Fire even while a dialog, menu or listbox popup is open. */
  allowInLayer?: boolean | undefined;
};

type Registration = {
  binding: string;
  character: boolean;
  handler: React.RefObject<(event: KeyboardEvent) => void>;
  options: React.RefObject<ShortcutOptions>;
  singleKey: React.RefObject<boolean>;
};

/*
  One listener per document, shared by every registration. A second copy of
  the kit adds its own; the first to handle a key calls preventDefault and
  the other skips it.
*/
const registrations: Registration[] = [];
let listening: Document | null = null;

const TEXT_INPUT_TYPES = new Set([
  "",
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
]);

/** True for an element that takes typed text. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!isElement(target)) return false;
  if ((target as HTMLElement).isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") return TEXT_INPUT_TYPES.has((target as HTMLInputElement).type);
  const role = target.getAttribute("role");
  return role === "textbox" || role === "searchbox" || role === "combobox" || role === "spinbutton";
}

// Focus inside one of these is in a popup. A listbox only counts when it is
// an open popup (below): a list on the page can be a listbox too.
const LAYER = '[role="dialog"], [role="alertdialog"], [role="menu"], dialog';
// Base UI marks its open popups `data-open`; `:modal` is a native modal
// <dialog>; other libraries' modals carry aria-modal.
const OPEN_LAYER =
  '[role="dialog"][data-open], [role="alertdialog"], [role="menu"][data-open], [role="listbox"][data-open], [aria-modal="true"]';

/**
 * True while a dialog, menu or listbox popup is open, or focus is in a
 * dialog or menu.
 */
export function isLayerOpen(target: EventTarget | null, doc: Document): boolean {
  if (isElement(target) && target.closest(LAYER)) return true;
  if (doc.querySelector(OPEN_LAYER)) return true;
  try {
    return doc.querySelector(":modal") !== null;
  } catch {
    return false;
  }
}

const ACTIVATES =
  'button, a[href], summary, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="option"], [role^="menuitem"], [role="treeitem"], [role="gridcell"]';
const COMPOSITE =
  '[role="menu"], [role="menubar"], [role="listbox"], [role="radiogroup"], [role="tablist"], [role="toolbar"], [role="tree"], [role="grid"], [role="slider"], [role="separator"][tabindex]';
const ARROWS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]);

/** True when the focused element handles this key itself. */
function targetOwnsKey(target: EventTarget | null, key: string): boolean {
  if (!isElement(target)) return false;
  if (key === "Enter" || key === "Space") return target.closest(ACTIVATES) !== null;
  if (ARROWS.has(key)) return target.closest(COMPOSITE) !== null;
  return false;
}

function isElement(target: EventTarget | null): target is Element {
  return target !== null && typeof (target as Element).closest === "function";
}

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.repeat) return;
  if (event.key === "Shift" || event.key === "Control" || event.key === "Alt" || event.key === "Meta") return;
  const step = bindingFromEvent(event);
  const doc = (event.currentTarget as Document | null) ?? document;
  let typing: boolean | undefined;
  let layer: boolean | undefined;
  for (let i = registrations.length - 1; i >= 0; i--) {
    const r = registrations[i]!;
    if (r.binding !== step) continue;
    const o = r.options.current;
    if (r.character && !r.singleKey.current) continue;
    typing ??= isTypingTarget(event.target);
    if (typing && (r.character || !o.allowInInput)) continue;
    layer ??= isLayerOpen(event.target, doc);
    if (layer && !o.allowInLayer) continue;
    // Unmodified only: ⌘Enter in a form is the app's, Enter is the control's.
    if (targetOwnsKey(event.target, step)) continue;
    event.preventDefault();
    r.handler.current(event);
    return;
  }
}

function register(doc: Document, reg: Registration): () => void {
  registrations.push(reg);
  if (!listening) {
    listening = doc;
    doc.addEventListener("keydown", onKeyDown);
  }
  return () => {
    const i = registrations.indexOf(reg);
    if (i >= 0) registrations.splice(i, 1);
    if (registrations.length === 0 && listening) {
      listening.removeEventListener("keydown", onKeyDown);
      listening = null;
    }
  };
}

const SingleKeyContext = React.createContext(false);

export type ShortcutsProviderProps = {
  /**
   * Character-key shortcuts on or off: the user's Settings switch. Off by
   * default; modifier chords and named keys work either way.
   */
  singleKeyShortcuts?: boolean | undefined;
  children?: React.ReactNode;
};

/** Turns character-key shortcuts on for the bindings registered inside it. */
export function ShortcutsProvider({ singleKeyShortcuts = false, children }: ShortcutsProviderProps) {
  return <SingleKeyContext.Provider value={singleKeyShortcuts}>{children}</SingleKeyContext.Provider>;
}

/**
 * Whether character-key shortcuts are on here. Show their key caps and
 * `aria-keyshortcuts` only when they are.
 */
export function useSingleKeyShortcuts(): boolean {
  return React.useContext(SingleKeyContext);
}

/**
 * Bind one or more keys while the calling component is mounted, e.g.
 * `useShortcut("mod+k", openPalette, { allowInInput: true })`. The handler
 * and options may change every render; only the bindings and `enabled`
 * re-register. Matching calls `preventDefault()`. See lib/shortcut-keys.ts
 * for the binding syntax.
 */
export function useShortcut(
  binding: string | readonly string[],
  handler: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {},
): void {
  const singleKeyShortcuts = React.useContext(SingleKeyContext);
  const handlerRef = React.useRef(handler);
  const optionsRef = React.useRef(options);
  const singleKeyRef = React.useRef(singleKeyShortcuts);
  React.useLayoutEffect(() => {
    handlerRef.current = handler;
    optionsRef.current = options;
    singleKeyRef.current = singleKeyShortcuts;
  });

  const enabled = options.enabled ?? true;
  const keys = (typeof binding === "string" ? [binding] : binding).join("\n");

  React.useEffect(() => {
    if (!enabled || !keys || typeof document === "undefined") return;
    const offs = keys.split("\n").map((b) => {
      const normalised = normaliseBinding(b);
      return register(document, {
        binding: normalised,
        character: isCharacterBinding(normalised),
        handler: handlerRef,
        options: optionsRef,
        singleKey: singleKeyRef,
      });
    });
    return () => offs.forEach((off) => off());
  }, [keys, enabled]);
}
