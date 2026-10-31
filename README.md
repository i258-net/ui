# i258 Design System (`i258-net/ui`)

Shared UI for i258 apps. Human-facing name: **i258 Design System**. Package: **`@i258/ui`**. Workshop: **i258 UI**.

Vision and decisions live in `i258-net/dotbuzz` → `PLANS/I258_DESIGN_SYSTEM_VISION.md` (I25-153).

## Status

Scaffold + inside-out baseline in Storybook. Not a finished brand. Consumers:
Honeycomb + abacus targeting `@i258/ui@0.5.2` (packaging fix: ESM dist must match `exports`).

| | |
|---|---|
| Repo | public |
| Package | `@i258/ui` on npmjs.org (org `i258`) — `0.5.1` tagged broken for bundlers; this branch targets `0.5.2` |
| License | MIT — Copyright (c) 2026 Daniel Newton |
| Stack | pnpm · TypeScript 7 · Tailwind v4 (`--i258-*` + `@layer i258-components` → compiled CSS) · self-hosted Geist Sans/Mono + i258 Symbols · Base UI/CVA · Storybook 10 |
| Baseline | Tokens + light/dark themes · Button, Input, Textarea, Label, FormField, Link, Checkbox, Badge, Surface, Alert, ToggleChip, Disclosure, Choice/ChoiceGroup, ThemeToggle, Kbd, Dialog, Menu, Tooltip, Tabs, Table, Select, StatusLabel, EmptyState |
| Patterns | AppShell — shared application chrome (title · nav · meta · theme + identity) · AppFrame — sidebar / header / main / inspector frame (FrameHeader, Sidebar family, Inspector, PaneResizeHandle, `useMediaQuery`) · CommandPalette (⌘K) · `useShortcut` / `ShortcutsProvider` · SummaryStrip / SummaryTile |
| Themes | Zinc / indigo — Day (light) + Night (dark), one family at two exposures |
| Quality | Storybook vitest + addon-a11y (`test: "error"`); in-repo Playwright VRT (`pnpm vrt`) |
| Lint | Biome (`pnpm lint` = `biome ci`; `pnpm lint:fix` / `pnpm format` write) — rules in `biome.json`; no typescript-eslint until it supports TS 7 |

### Tone tokens

Each tone (`accent`, `danger`, `warning`, `success`) ships four values, and
which one you reach for is the whole grammar:

| Token | Use it for |
| --- | --- |
| `--i258-<tone>` | a **fill** — a filled button, a checkbox tick, the source colour a wash is mixed from |
| `--i258-<tone>-foreground` | text **on** that fill, and nothing else |
| `--i258-<tone>-text` | the tone as **type** — on the page, on a surface, or on a soft wash of itself (quiet tags, inline errors, chip labels) |
| `--i258-<tone>-hover` | the fill's hover step for this exposure (`accent` and `danger` only) |

`--i258-<tone>` is mid-lightness in Day so it can carry its `-foreground`; that
makes it unreadable as type on a light background. Use `-text` there. Day
`-text` values are the same hue darkened; Night `-text` equals the tone.

Status tags are a soft wash of the tone plus a hairline plus `-text` — a
4px-cornered tag, not a solid pill. `Badge` already does this; app-level tags should bridge to it
rather than restate their own hexes, which do not survive a theme flip.
`--i258-tint-mix` is the share of a tone in that wash.

### Surfaces, edges and density

| Token | Use it for |
| --- | --- |
| `--i258-background` → `--i258-surface` → `--i258-surface-raised` | the page ladder (page, cards/sidebars, wells) |
| `--i258-hover`, `--i258-selected` | a hovered and a selected row or item |
| `--i258-border` | a **decorative** hairline — separators, panel and card edges. Deliberately under 3:1 |
| `--i258-border-strong` | the edge that **identifies a control** — inputs, checkboxes, toggle chips. ≥3:1 on every surface above, hover and selected included |
| `--i258-indicator` | a pressed/current state — a pressed chip's edge, a selected row's bar, an active tab |

Contrast for every pairing the kit relies on is asserted by
`packages/ui/src/lib/contrast.test.ts`, which reads `themes.css` directly.

Type: `--i258-text-sm` (13px) is the UI default; `2xs`/`xs` are meta, `md`–`2xl` step
up from 14px. Control heights are `--i258-control-xs|sm|md|lg` and `--i258-input-height`.

Density is a token switch: put `data-density="compact"` on any ancestor and control
heights, `--i258-row-height`, `--i258-row-pad-y`, `--i258-cell-pad-y` and the
`--i258-pane-*` rhythm move together (`data-density="comfortable"` restores them in a
subtree). `--i258-control-xs` stays 24px (the WCAG 2.2 target floor) and coarse
pointers keep 44×44 targets in either density — width as well as height, under
either `box-sizing` (`apps/workshop/vrt/target-size.spec.ts`).

The checkbox element is its target and draws its 16px box inside: it takes 24×24 of
layout on fine pointers and 44×44 on coarse ones, so checkboxes placed side by side or
stacked never overlap each other's hit areas (`vrt/checkbox-activation.spec.ts` clicks
real checkboxes 12px apart and stacked flush). If you spaced a 16px checkbox by hand,
expect it to sit 4px (fine) or 14px (coarse) further from its neighbours than before.
The same holds with `render={<button />} nativeButton`: the kit clears the button's
UA border, padding, background and appearance itself, so no consumer reset is needed.

Consumers import **compiled** CSS (`@i258/ui/styles.css`). They do **not** Tailwind-scan this package's source. The package builds CSS with `@tailwindcss/cli` using **`@layer i258-components` + plain `--i258-*` custom properties** (no `@theme` / no `tailwindcss/theme` import — those emit unprefixed `--font-sans` / `--radius-md` that collide with consumer Tailwind). No preflight, no utilities. Component classes are package-owned (`i258-*`). `--i258-font-sans` / `--i258-font-mono` point at self-hosted **Geist** (SIL OFL), followed by **i258 Symbols** (Noto Sans Symbols / Symbols 2 subsets for ⌃ ⌘ ⌥ ⌫ ✓, SIL OFL), which Geist lacks, so `Kbd` glyphs and the pressed ✓ boxes render the same on every platform; `styles.css` / `tokens.css` ship `@font-face` plus `dist/fonts/*.woff2` so Storybook, Playwright VRT, Chromatic, and consumers rasterize the same outlines.

**Cascade layers:** component rules ship in `@layer i258-components`, not Tailwind's shared `components` name. Layer order is first-declaration-wins, so a Tailwind consumer's preflight (`base`) can beat or lose to us depending on import order if we share `components`. Declare order **before** any `@import`:

```css
/* layers.css — order statement alone; import this file first */
@layer theme, base, components, i258-components, utilities;
```

```css
/* globals.css (or app entry) */
@import "./layers.css";
@import "tailwindcss";
@import "@i258/ui/styles.css";
```

That puts our primitives above preflight/`components` and below utilities (so utility overrides still work).

**Import order caveat:** the order statement must reach the browser **before** the package CSS. Under webpack/css-loader (Next.js), `@import`s are emitted ahead of the importing file's own rules — so putting the `@layer …` line in the *same* file as `@import "@i258/ui/styles.css"` lands it *after* `i258-components` and is a no-op. Use an earlier import (e.g. `./layers.css`) as above. Honeycomb's consumer PR is the reference.

### Application frame

`AppFrame` is the workbench layout: `[ sidebar | header / main | inspector ]`, each pane scrolling on its own. `AppShell` stays supported for single-bar apps.

- **Kit owns:** layout, resize handles (window-splitter `role="separator"`), the icon rail, landmarks (sidebar `aside` + primary `nav`, header banner, `main`, inspector `aside`), the skip link, scroll padding under the sticky header, and the narrow-screen sheets.
- **Shared breakpoints:** below **768px** (`FRAME_NARROW_NAV`) the sidebar is a modal start sheet; below **980px** (`FRAME_NARROW_INSPECTOR`) the inspector is a modal end sheet. `useFrameLayout()` tells header controls which applies (a menu button opening `navSheetOpen`, or a rail toggle).
- **App owns:** sidebar/inspector content, routing, the open/selected state (`sidebarMode`, `navSheetOpen`, `inspectorOpen`), closing the nav sheet on navigation, and persisting widths.
- **One sheet at a time:** if both sheets are asked for, the newer one shows and the frame calls the other's `on…OpenChange(false)` (both at once: the inspector wins). A narrow page hydrated with `navSheetOpen` keeps it; only a real narrow → wide change closes it.
- **Widths fit the frame:** drawn widths (and what the handles announce) are clamped so `main` keeps `mainMinWidth` (default 320px); pane minimums are floors, and stored/controlled widths are not rewritten.
- **Frames narrower than their minimums** (embedded in a narrow container on a wide screen): the inspector becomes the end sheet, as below 980px; if the sidebar and `main` still do not fit, they share the frame in proportion to their minimums rather than push anything past its edge. The nav sheet follows the viewport only, since the app owns its opener. `useFrameLayout()` called inside the frame reports the frame's actual layout; outside it, the viewport breakpoints.
- **Focus:** sheets trap focus and return it to their opener. Inline, if the focused element disappears because the sidebar collapses or the inspector closes, focus moves to the current sidebar item, the inspector's opener, or `main` — never `<body>`. A sheet whose content the app removes (no `sidebar`, `sidebarMode="hidden"`, no `inspector`) returns focus to what had it before the sheet, unless another sheet takes over; a nav sheet removed that way is reported closed.
- **Refs:** a `ref` on `AppFrame` is composed with the frame's own (object or callback refs, including React 19 callback cleanups).

### Shortcuts and popups

`useShortcut(binding, handler, options?)` follows the shortcut rules
accepted in I25-119. They are the same in every app:

- **Single-character shortcuts are opt-in.** `1`, `u`, `?` fire only inside
  `<ShortcutsProvider singleKeyShortcuts>`. Wire that prop to the app's
  Settings on/off control (default off). Modifier chords (`mod+k` = ⌘K /
  Ctrl+K) and named keys (Enter, Escape) work without it.
- **Binding spelling.** `[mod+][ctrl+][alt+][shift+]key`, case-insensitive
  for single characters; `Space` is the space bar. In a chord with Ctrl, Alt
  or ⌘ a digit key binds by position, so write `mod+shift+1`: `mod+!` (any
  US-shifted digit symbol `!@#$%^&*()`) is read as the same binding. A
  character binding without a command modifier (`?`, `!`) is the character
  typed.
- **Typing and popup guards.** Nothing fires from a text field, select,
  combobox or contenteditable unless the binding passes `allowInInput`, and a
  character key never does. Nothing fires while a dialog, menu or listbox
  popup is open (or focus is in a dialog or menu) unless it passes
  `allowInLayer`. A focused control keeps Enter / Space, and composite widgets
  keep their arrow keys.
- **Enter confirms.** Pressing the same number again never confirms: there are
  no "press twice" bindings, and auto-repeat never fires a binding.
- **Visible action buttons.** Every shortcut needs a visible control that does
  the same thing, with its `Kbd` cap (`aria-hidden`) and `aria-keyshortcuts`
  shown while the shortcut is registered. Only single-character bindings are
  gated: show their cap and `aria-keyshortcuts` only when
  `useSingleKeyShortcuts()` is true. Modifier chords and named keys (`mod+k`,
  Escape) keep both whenever they're registered. `formatShortcut` /
  `ariaKeyShortcuts` spell a binding for the current platform.

`Dialog`, `Menu` and `CommandPalette` sit on Base UI (focus trap, inert page,
Escape, focus return). Inside an `AppFrame` they portal into the frame's layer
and inherit its `data-theme` / `data-density`; elsewhere they portal to
`document.body`, so set the theme on `<html>` (as `themeScript()` does).
`CommandPalette` binds ⌘K / Ctrl+K itself (`shortcut={null}` to opt out). A
command with `navigates: true` leaves focus to the app, which should move it
to the new view's heading.

### Status, tone and tips

- **Amber means waiting on you.** `warning` is for a decision, an action or a
  review that needs the user, and nothing else: blocked, missing priority,
  drift and stale rows are `neutral` / `muted` with their own glyph. The one
  sanctioned exception (accepted in I25-119) is a global stale-data notice (an
  `EmptyState` or `Alert` about the whole view), which may be amber because it
  affects trust in everything shown. `danger` is broken data or a failing
  check; `success` a passing one.
- **`StatusLabel`** is a status as glyph + word, colour on the status only
  (never the row); `tinted` adds the badge wash. The app maps its values to
  tones. **`Badge`** is a quiet tag for anything else.
- **`SummaryStrip` / `SummaryTile`:** counts above a view, shared by Honeycomb
  and Abacus. A tile is a filter (`pressed` makes it a toggle button), a link
  (`render={<a href=… />}`) or a readout (`render={<div />}`); the count leads
  its name ("9 Decisions waiting on you"). Its tone shows only while the count
  is non-zero (or `alert`); `"—"` means unknown, never a fake zero, and has no
  tone even with `alert`. Pressed is an indicator edge plus a ✓ box.
- **`Tooltip`** is a visual label for an icon-only control or a glyph, never
  content: the tip is `aria-hidden`, so the trigger keeps its own name
  (`aria-label`, or visually hidden words on a glyph). It meets WCAG 1.4.13
  (hoverable, persistent, dismissible), opens on hover and keyboard focus but
  never on a tap, and **Escape closes only the tip** — an enclosing dialog,
  sheet, menu or `useShortcut("Escape")` handler (closing an inline inspector)
  waits for the next press. Wrap neighbouring tips in one `TooltipProvider`,
  where they live (a toolbar, a row of glyphs) or once at the app root; the
  kit mounts none at the root and `AppFrame` adds none. A trigger with its
  own touch gesture drives the tip through `open` / `onOpenChange`.
- **Sidebar rail names** are `Tooltip`s, owned by `SidebarItem`: name and
  count on hover, keyboard focus and a touch long-press (500ms; it shows the
  name without following the link, opening the link menu or selecting text,
  and stays until a tap elsewhere or Escape; no `onClick` runs for it, the
  item's or a `render` element's). The link keeps its own accessible name. Names stay on one
  line, and the rail opens them after 300ms (the kit's 100ms close delay
  applies). `Sidebar` brings its own `TooltipProvider` for them, so
  apps mount nothing for the rail; an app-root provider does not change the
  rail's timing.
- **`Select`** is a native `<select>`; `Tabs` are Base UI tabs (arrows move,
  Enter/Space select); `Table` is a plain semantic table, and
  `TableContainer` scrolls a wide one in place (a keyboard stop, and a region
  when named, only while it overflows).

## Workspace

```
packages/ui     # @i258/ui
apps/workshop   # Storybook 10
```

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test          # @i258/ui unit vitest + workshop story a11y (Playwright Chromium)
pnpm workshop      # http://localhost:6006
```

Story a11y runs via `@storybook/addon-vitest` + `@storybook/addon-a11y` with
`parameters.a11y.test = "error"`. First run downloads Chromium via Playwright.
No `.github/workflows/` change in the a11y PR — existing `pnpm test` CI step picks it up.

**VRT:** `pnpm vrt` builds static Storybook and screenshots core primitives (light + dark).
Update baselines with `pnpm vrt:update`. Snapshots live under
`apps/workshop/vrt/*-snapshots/`. Linux CI is the source of truth — take baselines from the
CI `vrt-results` `*-actual.png` artifacts; Darwin renders differ in text widths by ~2px and
fail CI. CI job for `pnpm vrt` is a separate PR (CODEOWNERS on `.github/workflows/`).
Comparisons run at `maxDiffPixels: 0` and `threshold: 0.005`: one pixel whose YIQ distance
exceeds 0.005 fails, just above the 0.0039 a one-level step per channel can reach. So one-level
rounding passes: Playwright 1.64.1's Chromium
moves up to 23,508 px of the overlay screens by exactly that much. Palette changes fail,
including I25-106's repaint and a 10° hue turn of the Day success/danger badge washes, which
moves pixels by up to 5 levels (it would pass at 0.01). Anti-aliased pixels remain excluded,
so a change touching only glyph edges can still pass (`apps/workshop/playwright.config.ts`).
## Using `@i258/ui`

```ts
import { Button } from "@i258/ui";
```

Import CSS from your app stylesheet (with the `@layer` order line above), not only from JS — JS-side CSS imports often land after Tailwind and freeze the wrong layer order.

Wrap the app (or a subtree) with `data-theme="light"` or `data-theme="dark"`. Without an explicit theme, dark follows `prefers-color-scheme`.

For a user-controlled theme with no first-paint flash, inject `themeScript()` before paint and render `ThemeToggle` (persists to `localStorage` key `i258-theme`, default `dark`). The control is an animated Classic sun/moon icon (adapted from [toggles.dev Classic](https://toggles.dev/toggles/classic), MIT). Its geometry is drawn from `--i258-theme-is-dark`, which every theme block sets, so it is already correct in server HTML and inside any `data-theme` subtree:

```tsx
import { ThemeToggle, themeScript } from "@i258/ui";

<html lang="en" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
  </head>
  <body>
    <ThemeToggle />
    {children}
  </body>
</html>
```

Do not hardcode `data-theme` on `<html>` when using the script — the script owns the attribute. `suppressHydrationWarning` is required on `<html>`: the script sets `data-theme` before React hydrates, so the server markup (no attribute) and the client DOM will disagree without it. `ThemeToggle` itself starts from the kit default (`dark`) until a layout effect reads storage (before paint); motion stays off until after that paint so a light-stored preference does not animate moon→sun on every load.

Every mounted `ThemeToggle` also listens for the `storage` event, so a change made in one tab lands in every other open tab without a reload. Storage is the source of truth — a `localStorage.clear()` elsewhere resets the page to the kit default. Use `subscribeToTheme(onChange, storageKey?)` directly if a surface needs to follow the theme without rendering a toggle; it returns an unsubscribe function and is a no-op on the server.

## Releases

- Changelog: `packages/ui/CHANGELOG.md` (from 0.8.0; earlier versions are in commit titles).
- CI: `.github/workflows/ci.yml` (default `GITHUB_TOKEN`; `workshop-image` uses org `CI_APP_*` for k8s digest PRs — I25-155).
- Publish: `.github/workflows/release.yml` on `v*` tags, job `environment: npm`, OIDC trusted publishing (no npm token secret). Trusted Publisher is configured; Daniel approves the `npm` environment on each tag publish.
- Workflow edits under `.github/workflows/` require CODEOWNERS review (`@euporphium`).

## Contribution rules (short)

- Token for a recurring design decision.
- Primitive for reusable interaction behavior.
- Variant when the difference is semantic.
- Shared pattern after **two** real consumers need it.
- No app-domain terminology in `@i258/ui`.
