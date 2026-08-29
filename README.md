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
| Stack | pnpm · TypeScript 7 · Tailwind v4 (`--i258-*` + `@layer i258-components` → compiled CSS) · self-hosted Geist Sans/Mono · Base UI/CVA · Storybook 10 |
| Baseline | Tokens + light/dark themes · Button, Input, Textarea, Label, FormField, Link, Checkbox, Badge, Surface, Alert, ToggleChip, Disclosure, Choice/ChoiceGroup |
| Themes | light + dark semantic tokens |
| Quality | Storybook vitest + addon-a11y (`test: "error"`); in-repo Playwright VRT (`pnpm vrt`) |
| Lint | deferred until typescript-eslint supports TS 7 (hard reject on 7.0.2) |

Consumers import **compiled** CSS (`@i258/ui/styles.css`). They do **not** Tailwind-scan this package's source. The package builds CSS with `@tailwindcss/cli` using **`@layer i258-components` + plain `--i258-*` custom properties** (no `@theme` / no `tailwindcss/theme` import — those emit unprefixed `--font-sans` / `--radius-md` that collide with consumer Tailwind). No preflight, no utilities. Component classes are package-owned (`i258-*`). `--i258-font-sans` / `--i258-font-mono` point at self-hosted **Geist** (SIL OFL); `styles.css` / `tokens.css` ship `@font-face` plus `dist/fonts/*.woff2` so Storybook, Playwright VRT, Chromatic, and consumers rasterize the same outlines.

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
`apps/workshop/vrt/*-snapshots/`. CI job for `pnpm vrt` is a separate PR (CODEOWNERS
on `.github/workflows/`).
## Using `@i258/ui`

```ts
import { Button } from "@i258/ui";
```

Import CSS from your app stylesheet (with the `@layer` order line above), not only from JS — JS-side CSS imports often land after Tailwind and freeze the wrong layer order.

Wrap the app (or a subtree) with `data-theme="light"` or `data-theme="dark"`. Without an explicit theme, dark follows `prefers-color-scheme`.

## Releases

- CI: `.github/workflows/ci.yml` (default `GITHUB_TOKEN`; `workshop-image` uses org `CI_APP_*` for k8s digest PRs — I25-155).
- Publish: `.github/workflows/release.yml` on `v*` tags, job `environment: npm`, OIDC trusted publishing (no npm token secret). Trusted Publisher is configured; Daniel approves the `npm` environment on each tag publish.
- Workflow edits under `.github/workflows/` require CODEOWNERS review (`@euporphium`).

## Contribution rules (short)

- Token for a recurring design decision.
- Primitive for reusable interaction behavior.
- Variant when the difference is semantic.
- Shared pattern after **two** real consumers need it.
- No app-domain terminology in `@i258/ui`.
