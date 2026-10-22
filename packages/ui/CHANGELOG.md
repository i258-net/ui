# Changelog — `@i258/ui`

0.x: a minor bump may change how existing components look or measure; a patch
does not. Entries before 0.8.0 live in the commit titles (`… (0.7.3) (#69)`).

## Unreleased

- `Tooltip` takes optional `open` / `onOpenChange`, for a trigger with its own
  touch gesture. Uncontrolled use is unchanged.
- Sidebar rail names are now the kit `Tooltip` (I25-124): hover, keyboard
  focus and a touch long-press (500ms), which shows the name without
  following the link; no `onClick` runs for it (the item's or a `render`
  element's). The tip takes
  the `Tooltip`'s look (`--i258-background`, `--i258-shadow-lg`, weight 500)
  instead of the raised surface, and keeps the name on one line. The private
  `.i258-sidebar__tip-positioner` class is gone. `Sidebar` brings its own
  `TooltipProvider`; apps mount nothing for the rail.

## 0.8.0

The workbench direction: new palette, type scale and density tokens, a shared
application frame, overlays and shortcuts, and data-view primitives. No export,
`i258-*` class or `--i258-*` token was removed or renamed. Many token **values**
changed, though, so every existing component looks and measures differently.

Changes since 0.7.3: #81 (I25-106), #83 (I25-107), #86 (I25-108), #87
(I25-109), plus #80 (I25-117) and dependency bumps.

### What consumers must do

- **Expect the new look and smaller sizes.** Update any app screenshots or
  visual tests. The kit ships no preflight (see AGENTS.md), so controls with a
  1px border state both ways: content-box outer height, then under a border-box
  reset such as Tailwind Preflight. Default (`md`) Button `--i258-control-md`
  2.25rem→2rem (38→34px content-box; 36→32px border-box). Input
  `--i258-input-height` 2.25rem→1.875rem (38→32px content-box; 36→30px
  border-box). ThemeToggle (default `sm`) `--i258-control-sm` 2rem→1.75rem
  (34→30px content-box; 32→28px border-box). AppShell bar ~41px tall (was ~45;
  tallest child is usually ThemeToggle plus `--i258-space-3` padding and the
  bottom hairline). Body UI text is 13px (was 14).
- **Checkbox takes more layout space.** The element is now its own 24×24 target
  (44×44 on coarse pointers) and draws a 1rem box inside (20→18px content-box
  outer edge; 18→16px border-box). A checkbox you spaced by hand sits 4px
  (fine) / 14px (coarse) further from its neighbours.
- **Keep declaring layer order before any import.** This hasn't changed:
  `@layer theme, base, components, i258-components, utilities;` in an earlier
  file (see README "Cascade layers").
- **Serve the new font files.** `dist/fonts/` adds
  `NotoSansSymbols-Keys.woff2` and `NotoSansSymbols2-UI.woff2` (~4 KB total)
  next to Geist. `styles.css` / `tokens.css` reference them relatively, the
  same way as Geist. If you copy fonts by hand or set a CSP `font-src`, include them.
- **Set the theme on `<html>` if you use popups outside `AppFrame`.**
  Outside an `AppFrame`, `Dialog`, `Menu`, `CommandPalette` and `Tooltip`
  portal to `document.body`. Inside one, they inherit the frame's `data-theme` / `data-density`.
- **Wire single-key shortcuts to a setting.** To offer them, wrap the app in
  `<ShortcutsProvider singleKeyShortcuts={setting}>` (off by default).
- `@base-ui/react` dependency floor is now `^1.9.0` (was `^1.7.0`).

### Tokens

- **Palette:** Tokyo Day/Night is replaced by zinc neutrals with an indigo
  accent, in Day (light) and Night (dark). `contrast.test.ts` asserts every
  pairing the kit uses in both themes, including controls on hovered and selected rows.
- **New colour/state tokens:** `--i258-hover`, `--i258-selected` (row states);
  `--i258-border-strong` (the edge that identifies a control, ≥3:1 on every
  surface) alongside the decorative `--i258-border`; `--i258-indicator`
  (pressed/current); `--i258-tint-mix` (share of a tone in a wash);
  `--i258-scrim`; `--i258-shadow-lg`.
- **Type scale:** `--i258-text-sm` 14→13px is the UI default; `md` 16→14,
  `lg` 18→16, `xl` 20→18. New: `--i258-text-2xs` (11px), `--i258-text-2xl`
  (22px), `--i258-leading-snug`.
- **Space / radius / shadow:** new `--i258-space-5`, `--i258-space-10`,
  `--i258-radius-xl`. `--i258-radius-md` 6→8px, `--i258-radius-lg` 8→10px.
  `--i258-shadow-sm` / `-md` are softer.
- **Sizing:** `--i258-control-xs|sm|md|lg`, `--i258-input-height`,
  `--i258-target-coarse` (44px), `--i258-header-height`, `--i258-sidebar-rail`,
  `--i258-resize-target`, `--i258-press-scale`.
- **Density:** setting `data-density="compact"` on an ancestor changes control
  heights, `--i258-row-height`, `--i258-row-pad-y`, `--i258-cell-pad-y`,
  `--i258-pane-pad-x|y`, `--i258-pane-gap`, `--i258-tile-pad-y` and
  `--i258-tile-count-size` together. `data-density="comfortable"` restores them
  in a subtree. `--i258-control-xs` stays 24px, and coarse pointers keep 44×44
  targets in either density and under either `box-sizing`.
- **Font stacks:** `--i258-font-sans` / `--i258-font-mono` add
  `"i258 Symbols"` after Geist (see below).

### Frame primitives (`@i258/ui/app-frame`, `/sidebar`, `/pane-resize-handle`, `/use-media-query`)

- `AppFrame`: `[ sidebar | header / main | inspector ]` with independently
  scrolling panes. The sidebar can be expanded, a rail or hidden. Sidebar and
  inspector widths are resizable, controlled or uncontrolled, and fitted so
  `main` keeps `mainMinWidth`. Also: a skip link, landmarks, and a
  `data-density` switch. Below 768px (`FRAME_NARROW_NAV`) the sidebar becomes a
  modal start sheet; below 980px (`FRAME_NARROW_INSPECTOR`) the inspector
  becomes an end sheet. Only one sheet is open at a time. When the focused
  element disappears, focus moves to the current item, the opener or `main`,
  never `<body>`. `useFrameLayout()` reports which layout applies. `AppShell`
  is unchanged and still supported.
- `FrameHeader` (breadcrumb → h1 → meta, actions). The frame measures it so the
  main pane's scroll padding keeps focused elements out from under it.
- `Inspector`.
- `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`,
  `SidebarSection` (collapsible), `SidebarItem` (render-prop link),
  `useSidebarCollapsed`.
- `PaneResizeHandle`: window splitter (`role="separator"`). Keys: arrows /
  Shift / Home / End / Enter. RTL-aware. The hit strip is 24px (44px coarse).
- `useMediaQuery`.

### Overlays and shortcuts (`/dialog`, `/menu`, `/command-palette`, `/kbd`, `/use-shortcut`)

- `Dialog` family on Base UI: backdrop, sizes, title / description / body /
  footer. The corner Close is on by default.
- `Menu` family on Base UI: items, link items, checkbox and radio items,
  groups, separators.
- `CommandPalette`: a ⌘K / Ctrl+K dialog holding an ARIA 1.2 combobox with a
  grouped listbox. `shortcut={null}` opts out of the binding. `navigates`
  commands leave focus to the app. Also exports `defaultCommandFilter`.
- `Kbd` key cap.
- `useShortcut`, `ShortcutsProvider`, `useSingleKeyShortcuts`,
  `isTypingTarget`, plus the pure helpers `formatShortcut`, `ariaKeyShortcuts`,
  `normaliseBinding`, `isCharacterBinding`, `isApplePlatform`.
- **Shortcut decision (I25-119):**
  - Single-character shortcuts are opt-in. They fire only inside
    `ShortcutsProvider singleKeyShortcuts`. Modifier chords and named keys
    work without it.
  - Nothing fires from a text field, or while a dialog / menu / listbox is
    open, unless the binding passes `allowInInput` / `allowInLayer`.
  - A focused control keeps Enter / Space, and composite widgets keep their
    arrow keys.
  - Auto-repeat never fires a binding, and there are no press-twice bindings.
  - Only single-character bindings hide their cap and `aria-keyshortcuts`
    while the setting is off.

### Data-view components (`/table`, `/tabs`, `/status-label`, `/empty-state`, `/summary-strip`, `/tooltip`, `/select`)

- `Table`, `TableContainer`, `TableCaption`, `TableHeader`, `TableBody`,
  `TableRow`, `TableHead`, `TableCell`: a semantic table with a sticky header,
  numeric/mono cells and density padding. `TableContainer` is a keyboard stop
  (and a region when named) only while it overflows.
- `Tabs`, `TabsList`, `Tab`, `TabsPanel` on Base UI: underline strip with
  indicator bar and counts. Supports vertical orientation, with the bar on the
  inline-end edge.
- `StatusLabel`: glyph + word, with colour on the status only. `tinted` adds
  the badge wash.
- `EmptyState`: one panel for empty / no results / stale / failed.
- `SummaryStrip` / `SummaryTile`: counts above a view. Each tile is a toggle
  filter (`pressed`), a link or a readout. A tile's tone shows only while its
  count is non-zero (or with `alert`). `"—"` means unknown and never takes a tone.
- `Tooltip` / `TooltipProvider` on Base UI: meets WCAG 1.4.13. Opens on hover
  and focus, never on touch. The tip is `aria-hidden`. Escape closes only the
  tip, not an enclosing dialog, sheet or menu.
- `Select`: native `<select>` with a chevron, `sm`/`md`/`lg`, Field-aware
  through `FormField`.
- Amber (`warning`) is documented as meaning "waiting on you" only. The one
  exception is a global stale-data notice.

### Changed components

- **Button:** new `size="xs"` (24px at any density) and `shape="icon"`
  (square, for icon-only buttons with an `aria-label`). Press scale. An open
  ghost menu trigger keeps its fill. Heights follow `--i258-control-*`.
- **ToggleChip:** pressed shows a ✓ in a box. The box is drawn empty (3:1)
  when off, so the label doesn't shift and state isn't colour alone.
  Unpressed edge is `--i258-border-strong`; pressed uses `--i258-indicator`
  plus a 2px edge.
- **Badge:** 20px tag with 4px corners at 11px, instead of a pill. Wash uses
  `--i258-tint-mix`.
- **Checkbox:** the element is its own 24/44px target, as above. It clears
  native button chrome itself when rendered with `render={<button />} nativeButton`.
- **Input, Textarea, Choice:** edges use `--i258-border-strong`, and pressed
  choices use `--i258-indicator`. **Input** heights and **Choice** `chip` `md`
  height follow the density tokens; **Textarea** min-heights and **Choice**
  `option` padding are fixed and ignore `data-density`.
- **Coarse pointers:** buttons, chips, choices, selects and tabs get a 44px
  minimum width as well as height.
- New pieces have forced-colours and reduced-motion rules.

### Self-hosted symbol font

Geist lacks ⌃ ⌘ ⌥ ⌫ ✓, so each platform used to fill them from its own system
font. The kit now ships an **i258 Symbols** family. It is made of Noto Sans
Symbols / Symbols 2 subsets limited to those five code points, SIL OFL 1.1,
licence at `dist/fonts/NotoSansSymbols-OFL.txt`. It is declared with
`unicode-range`, so it never replaces Geist for other characters.

### Workshop and VRT (not shipped)

- New Playwright specs:
  - behaviour and geometry: `frame`, `frame-panes`, `overlays`, `tooltip`
    (real pointer), `summary-strip`
  - hit tests: `target-size` (compiled CSS under both box-sizing models, both
    densities, fine and coarse) and `checkbox-activation`
  - screenshots: `frame-screens`, `overlays-screens`
- Re-shot every primitive baseline and the Button docs page for the new
  palette and sizes. Baselines come from CI Linux actuals or the Playwright
  v1.63.0-noble image, which renders byte-identically.
- The primitives, frame, docs and overlay gates wait for "i258 Symbols" to
  load before shooting.
- `pnpm vrt` builds the kit stylesheet first.
- Storybook pre-bundles kit dependencies and loads fonts before rendering
  stories, which fixes the test races from #80.
