import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { DialogContent, DialogTitle } from "./dialog.js";
import { Kbd } from "./kbd.js";
import { useShortcut } from "../lib/use-shortcut.js";
import { cn } from "../lib/utils.js";

export type CommandItem = {
  id: string;
  label: string;
  /** Group heading. Groups show in the order they first appear in `items`. */
  group?: string | undefined;
  /** Extra match terms that aren't shown: ids, synonyms. */
  keywords?: readonly string[] | undefined;
  /** Leading glyph. Decorative. */
  icon?: React.ReactNode | undefined;
  /** End-aligned detail: a status word, a count, a shortcut. Shown, not read. */
  detail?: React.ReactNode | undefined;
  /**
   * Choosing it moves to another view. The palette then leaves focus alone
   * as it closes, so the app can put it on the new view's heading (in an
   * effect once that view has rendered). Other commands return focus to
   * where the palette was opened from.
   */
  navigates?: boolean | undefined;
  onSelect: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: readonly CommandItem[];
  /**
   * Toggles the palette from anywhere, text fields included. Default
   * `"mod+k"` (⌘K / Ctrl+K); `null` to bind it yourself with `useShortcut`.
   * While another dialog or menu is open it does not open the palette.
   */
  shortcut?: string | null | undefined;
  /**
   * Narrow `items` to what matches `query`, in display order. Default:
   * every whitespace-separated word appears in the label, group or keywords
   * (case-insensitive), in `items` order.
   */
  filter?: ((items: readonly CommandItem[], query: string) => readonly CommandItem[]) | undefined;
  /** The search field's accessible name. Default "Search commands". */
  label?: string | undefined;
  placeholder?: string | undefined;
  /** The dialog's (visually hidden) title. Default "Command palette". */
  title?: string | undefined;
  /** Shown and announced when nothing matches. Default "No matches". */
  emptyLabel?: string | undefined;
  /** Where the palette portals to. See DialogContent. */
  container?: HTMLElement | null | undefined;
  className?: string | undefined;
};

export function defaultCommandFilter(
  items: readonly CommandItem[],
  query: string,
): readonly CommandItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return items;
  return items.filter((item) => {
    const hay = [item.label, item.group ?? "", ...(item.keywords ?? [])].join(" ").toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="i258-palette__search-icon">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * ⌘K palette: a modal dialog holding an ARIA 1.2 combobox that controls a
 * grouped listbox. Focus stays in the search field; ↑/↓ move the active
 * option (`aria-activedescendant`), Ctrl+Home / Ctrl+End jump to the ends,
 * Enter runs it, Escape closes. The result count is announced politely.
 * Controlled: the app owns `open`.
 */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  shortcut = "mod+k",
  filter = defaultCommandFilter,
  label = "Search commands",
  placeholder = "Search or jump to…",
  title = "Command palette",
  emptyLabel = "No matches",
  container,
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  // Each opening starts from an empty query (state reset during render, so
  // the first frame never shows the previous search).
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  // Set when the chosen command navigates; every opening starts it clear,
  // however the palette was opened (shortcut, the app's button, a trigger).
  const navigated = React.useRef(false);
  React.useEffect(() => {
    if (open) navigated.current = false;
  }, [open]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const baseId = React.useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-option-${i}`;

  useShortcut(shortcut ?? [], () => onOpenChange(!open), {
    enabled: shortcut != null,
    allowInInput: true,
    // Close from inside; never open over another dialog or menu.
    allowInLayer: open,
  });

  // Matches gathered under their group headings, and `results` in that same
  // order: what's drawn is what ↑/↓, the active option and Enter walk, even
  // when the filter interleaves groups.
  const { groups, results } = React.useMemo(() => {
    const byName = new Map<string, CommandItem[]>();
    for (const item of filter(items, query.trim())) {
      const name = item.group ?? "";
      let entries = byName.get(name);
      if (!entries) byName.set(name, (entries = []));
      entries.push(item);
    }
    let index = 0;
    const groups = [...byName].map(
      ([name, entries]) => [name, entries.map((item) => ({ item, index: index++ }))] as const,
    );
    return { groups, results: [...byName.values()].flat() };
  }, [filter, items, query]);
  const activeIndex = results.length ? Math.min(active, results.length - 1) : -1;

  React.useEffect(() => {
    if (activeIndex < 0) return;
    const el = listRef.current?.querySelector(`[id="${CSS.escape(optionId(activeIndex))}"]`);
    el?.scrollIntoView({ block: "nearest" });
    // optionId is derived from baseId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, results]);

  const run = (item: CommandItem | undefined) => {
    if (!item) return;
    navigated.current = item.navigates === true;
    onOpenChange(false);
    item.onSelect();
  };

  const move = (to: number) => {
    if (!results.length) return;
    setActive((to + results.length) % results.length);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") move(activeIndex + 1);
    else if (e.key === "ArrowUp") move(activeIndex - 1);
    else if (e.key === "Home" && e.ctrlKey) move(0);
    else if (e.key === "End" && e.ctrlKey) move(results.length - 1);
    else if (e.key === "Enter") run(results[activeIndex]);
    else return;
    e.preventDefault();
  };

  const renderOption = ({ item, index }: { item: CommandItem; index: number }) => (
    <div
      key={item.id}
      id={optionId(index)}
      role="option"
      aria-selected={index === activeIndex}
      className="i258-palette__option"
      // Keep focus in the field; the pointer only moves the active option.
      onMouseDown={(e) => e.preventDefault()}
      onMouseMove={() => index !== activeIndex && setActive(index)}
      onClick={() => run(item)}
    >
      {item.icon != null ? (
        <span className="i258-palette__icon" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      <span className="i258-palette__label">{item.label}</span>
      {item.detail != null ? (
        <span className="i258-palette__detail" aria-hidden="true">
          {item.detail}
        </span>
      ) : null}
    </div>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("i258-palette", className)}
        size="lg"
        closeButton={false}
        container={container}
        initialFocus={inputRef}
        finalFocus={() => !navigated.current}
      >
        <DialogTitle className="i258-sr-only">{title}</DialogTitle>
        <div className="i258-palette__search">
          <SearchIcon />
          <input
            ref={inputRef}
            className="i258-palette__input"
            role="combobox"
            aria-label={label}
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            placeholder={placeholder}
            value={query}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        <div ref={listRef} id={listId} role="listbox" aria-label={title} className="i258-palette__list">
          {groups.map(([name, entries], g) =>
            name ? (
              <div
                key={name}
                role="group"
                aria-labelledby={`${baseId}-group-${g}`}
                className="i258-palette__group"
              >
                <div id={`${baseId}-group-${g}`} role="presentation" className="i258-palette__group-label">
                  {name}
                </div>
                {entries.map(renderOption)}
              </div>
            ) : (
              <React.Fragment key="">{entries.map(renderOption)}</React.Fragment>
            ),
          )}
        </div>
        {results.length === 0 ? (
          <p className="i258-palette__empty" aria-hidden="true">
            {emptyLabel}
          </p>
        ) : null}
        <div className="i258-palette__footer">
          <span aria-hidden="true">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> Move
          </span>
          <span aria-hidden="true">
            <Kbd>↵</Kbd> Run
          </span>
          <DialogPrimitive.Close className="i258-palette__close">
            <Kbd aria-hidden="true">Esc</Kbd> Close
          </DialogPrimitive.Close>
          <span className="i258-sr-only" role="status">
            {results.length === 0
              ? emptyLabel
              : `${results.length} result${results.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </DialogContent>
    </DialogPrimitive.Root>
  );
}
